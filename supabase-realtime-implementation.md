# Supabase Realtime Implementation for Payment Automation

## Overview
This implementation handles a complex payment automation flow with real-time progress updates using Supabase + Next.js. The system manages parallel validations, sequential payments, OTP handling, and comprehensive error recovery.

## Database Schema

### Core Tables

```sql
-- Main job tracking table
CREATE TABLE job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    job_type TEXT NOT NULL DEFAULT 'payment_automation',
    status TEXT NOT NULL, -- 'initiated', 'validating', 'processing', 'completed', 'failed'
    current_phase TEXT, -- 'validation', 'payment_processing', 'complete'
    progress_percentage INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 4,
    completed_transactions INTEGER DEFAULT 0,
    
    -- Job configuration
    transaction_amount INTEGER NOT NULL, -- e.g., 1500
    transaction_count INTEGER NOT NULL, -- e.g., 4
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Detailed step tracking
CREATE TABLE job_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_run_id UUID REFERENCES job_runs(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    step_type TEXT NOT NULL, -- 'validation', 'payment', 'redemption'
    status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed', 'waiting_otp'
    transaction_index INTEGER, -- For payment steps (1-4)
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    timeout_at TIMESTAMP WITH TIME ZONE,
    
    -- Step-specific data
    step_data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP tracking and management
CREATE TABLE otp_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_run_id UUID REFERENCES job_runs(id) ON DELETE CASCADE,
    job_step_id UUID REFERENCES job_steps(id) ON DELETE CASCADE,
    otp_type TEXT NOT NULL, -- 'gyftr_login', 'amazon_login', 'payment'
    phone_number TEXT,
    
    -- OTP lifecycle
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    timeout_at TIMESTAMP WITH TIME ZONE,
    
    -- OTP data
    otp_value TEXT,
    attempts_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    status TEXT NOT NULL DEFAULT 'requested' -- 'requested', 'received', 'verified', 'failed', 'expired'
);

-- Authentication session tracking
CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_type TEXT NOT NULL, -- 'gyftr', 'amazon'
    
    -- Session data
    auth_token TEXT,
    browser_context_id TEXT, -- For Browserbase
    session_data JSONB DEFAULT '{}'::jsonb,
    
    -- Session lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    is_active BOOLEAN DEFAULT true
);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE job_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE job_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE otp_requests;
```

## Backend Implementation

### 1. Job Orchestrator Class

```typescript
// lib/job-orchestrator.ts
import { createClient } from '@supabase/supabase-js'

export class PaymentJobOrchestrator {
    private supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
    
    async startJob(userId: string, config: JobConfig): Promise<string> {
        // Create job record
        const { data: job } = await this.supabase
            .from('job_runs')
            .insert({
                user_id: userId,
                status: 'initiated',
                current_phase: 'validation',
                transaction_amount: config.transactionAmount,
                transaction_count: config.transactionCount,
                metadata: config
            })
            .select()
            .single()
        
        // Start background processing
        this.processJobAsync(job.id)
        
        return job.id
    }
    
    private async processJobAsync(jobId: string) {
        try {
            await this.updateJobStatus(jobId, 'validating', 'validation')
            
            // Phase 1: Parallel Validation
            await this.runValidationPhase(jobId)
            
            // Phase 2: Sequential Payment Processing
            await this.runPaymentPhase(jobId)
            
            // Phase 3: Completion
            await this.completeJob(jobId)
            
        } catch (error) {
            await this.handleJobFailure(jobId, error)
        }
    }
    
    private async runValidationPhase(jobId: string) {
        // Create validation steps
        const steps = [
            { name: 'gyftr_login', type: 'validation' },
            { name: 'amazon_login', type: 'validation' },
            { name: 'availability_check', type: 'validation' }
        ]
        
        for (const step of steps) {
            await this.createJobStep(jobId, step.name, step.type)
        }
        
        // Run Gyftr and Amazon login in parallel
        const [gyftrResult, amazonResult] = await Promise.allSettled([
            this.handleGyftrLogin(jobId),
            this.handleAmazonLogin(jobId)
        ])
        
        // Check if both succeeded
        if (gyftrResult.status === 'rejected' || amazonResult.status === 'rejected') {
            throw new Error('Validation failed')
        }
        
        // Run availability check (depends on Gyftr login)
        await this.handleAvailabilityCheck(jobId)
        
        await this.updateJobPhase(jobId, 'payment_processing', 20)
    }
    
    private async runPaymentPhase(jobId: string) {
        const job = await this.getJob(jobId)
        
        for (let i = 1; i <= job.transaction_count; i++) {
            await this.processTransaction(jobId, i)
            
            // Update progress
            const progress = 20 + (i / job.transaction_count) * 80
            await this.updateJobProgress(jobId, progress, i)
        }
    }
    
    private async processTransaction(jobId: string, transactionIndex: number) {
        const steps = [
            'generate_payment_link',
            'process_payment',
            'wait_for_vouchers',
            'redeem_amazon_vouchers'
        ]
        
        for (const stepName of steps) {
            const step = await this.createJobStep(jobId, stepName, 'payment', transactionIndex)
            
            switch (stepName) {
                case 'generate_payment_link':
                    await this.handlePaymentLinkGeneration(jobId, step.id, transactionIndex)
                    break
                case 'process_payment':
                    await this.handlePaymentProcessing(jobId, step.id, transactionIndex)
                    break
                case 'wait_for_vouchers':
                    await this.handleVoucherWaiting(jobId, step.id, transactionIndex)
                    break
                case 'redeem_amazon_vouchers':
                    await this.handleAmazonRedemption(jobId, step.id, transactionIndex)
                    break
            }
        }
    }
    
    // OTP Management
    private async handleOTPFlow(jobId: string, stepId: string, otpType: string): Promise<string> {
        // Create OTP request
        const { data: otpRequest } = await this.supabase
            .from('otp_requests')
            .insert({
                job_run_id: jobId,
                job_step_id: stepId,
                otp_type: otpType,
                timeout_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
            })
            .select()
            .single()
        
        await this.updateStepStatus(stepId, 'waiting_otp')
        
        // Wait for OTP (polling approach)
        return await this.waitForOTP(otpRequest.id)
    }
    
    private async waitForOTP(otpRequestId: string): Promise<string> {
        const maxWaitTime = 5 * 60 * 1000 // 5 minutes
        const pollInterval = 2000 // 2 seconds
        const startTime = Date.now()
        
        while (Date.now() - startTime < maxWaitTime) {
            const { data: otpRequest } = await this.supabase
                .from('otp_requests')
                .select('*')
                .eq('id', otpRequestId)
                .single()
            
            if (otpRequest.status === 'received') {
                await this.supabase
                    .from('otp_requests')
                    .update({ status: 'verified', verified_at: new Date() })
                    .eq('id', otpRequestId)
                
                return otpRequest.otp_value
            }
            
            await new Promise(resolve => setTimeout(resolve, pollInterval))
        }
        
        throw new Error('OTP timeout')
    }
    
    // Utility methods
    private async updateJobStatus(jobId: string, status: string, phase?: string) {
        const updates: any = { status, updated_at: new Date() }
        if (phase) updates.current_phase = phase
        
        await this.supabase
            .from('job_runs')
            .update(updates)
            .eq('id', jobId)
    }
    
    private async createJobStep(jobId: string, stepName: string, stepType: string, transactionIndex?: number) {
        const { data: step } = await this.supabase
            .from('job_steps')
            .insert({
                job_run_id: jobId,
                step_name: stepName,
                step_type: stepType,
                status: 'pending',
                transaction_index: transactionIndex,
                started_at: new Date()
            })
            .select()
            .single()
        
        return step
    }
    
    private async updateStepStatus(stepId: string, status: string, errorMessage?: string) {
        const updates: any = { status, updated_at: new Date() }
        if (status === 'completed') updates.completed_at = new Date()
        if (errorMessage) updates.error_message = errorMessage
        
        await this.supabase
            .from('job_steps')
            .update(updates)
            .eq('id', stepId)
    }
}
```

### 2. API Routes

```typescript
// pages/api/jobs/start-payment.ts
import { PaymentJobOrchestrator } from '../../../lib/job-orchestrator'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }
    
    try {
        const orchestrator = new PaymentJobOrchestrator()
        const jobId = await orchestrator.startJob(req.body.userId, req.body.config)
        
        res.status(200).json({ jobId, message: 'Job started successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// pages/api/jobs/otp-received.ts
export default async function handler(req, res) {
    const { otpRequestId, otpValue } = req.body
    
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
    
    await supabase
        .from('otp_requests')
        .update({
            otp_value: otpValue,
            status: 'received',
            received_at: new Date()
        })
        .eq('id', otpRequestId)
    
    res.status(200).json({ success: true })
}
```

## Frontend Implementation

### 1. React Hook for Job Tracking

```typescript
// hooks/useJobProgress.ts
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export function useJobProgress(jobId: string) {
    const [job, setJob] = useState(null)
    const [steps, setSteps] = useState([])
    const [otpRequests, setOtpRequests] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    useEffect(() => {
        if (!jobId) return
        
        // Initial fetch
        fetchJobData()
        
        // Set up real-time subscriptions
        const jobSubscription = supabase
            .channel('job-progress')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'job_runs',
                filter: `id=eq.${jobId}`
            }, (payload) => {
                setJob(payload.new)
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'job_steps',
                filter: `job_run_id=eq.${jobId}`
            }, (payload) => {
                setSteps(prev => {
                    const existing = prev.find(s => s.id === payload.new.id)
                    if (existing) {
                        return prev.map(s => s.id === payload.new.id ? payload.new : s)
                    }
                    return [...prev, payload.new]
                })
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'otp_requests',
                filter: `job_run_id=eq.${jobId}`
            }, (payload) => {
                setOtpRequests(prev => {
                    const existing = prev.find(o => o.id === payload.new.id)
                    if (existing) {
                        return prev.map(o => o.id === payload.new.id ? payload.new : o)
                    }
                    return [...prev, payload.new]
                })
            })
            .subscribe()
        
        return () => {
            jobSubscription.unsubscribe()
        }
    }, [jobId])
    
    const fetchJobData = async () => {
        try {
            // Fetch job details
            const { data: jobData } = await supabase
                .from('job_runs')
                .select('*')
                .eq('id', jobId)
                .single()
            
            // Fetch steps
            const { data: stepsData } = await supabase
                .from('job_steps')
                .select('*')
                .eq('job_run_id', jobId)
                .order('created_at', { ascending: true })
            
            // Fetch OTP requests
            const { data: otpData } = await supabase
                .from('otp_requests')
                .select('*')
                .eq('job_run_id', jobId)
                .order('created_at', { ascending: true })
            
            setJob(jobData)
            setSteps(stepsData || [])
            setOtpRequests(otpData || [])
            setIsLoading(false)
        } catch (err) {
            setError(err.message)
            setIsLoading(false)
        }
    }
    
    return {
        job,
        steps,
        otpRequests,
        isLoading,
        error,
        currentOtpRequest: otpRequests.find(o => o.status === 'requested')
    }
}
```

### 2. Progress Display Component

```typescript
// components/JobProgressDisplay.tsx
import { useJobProgress } from '../hooks/useJobProgress'

export function JobProgressDisplay({ jobId }: { jobId: string }) {
    const { job, steps, otpRequests, isLoading, error, currentOtpRequest } = useJobProgress(jobId)
    
    if (isLoading) return <div>Loading job progress...</div>
    if (error) return <div>Error: {error}</div>
    if (!job) return <div>Job not found</div>
    
    const getStepsByPhase = (phase: string) => {
        return steps.filter(step => step.step_type === phase)
    }
    
    const getStepStatus = (step: any) => {
        switch (step.status) {
            case 'pending': return '⏳'
            case 'in_progress': return '🔄'
            case 'completed': return '✅'
            case 'failed': return '❌'
            case 'waiting_otp': return '📱'
            default: return '⏳'
        }
    }
    
    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Payment Automation Progress</h2>
                
                {/* Overall Progress */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-gray-600">{job.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress_percentage}%` }}
                        />
                    </div>
                </div>
                
                {/* Status and Phase */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <span className="text-sm font-medium text-gray-600">Status</span>
                        <p className="text-lg font-semibold capitalize">{job.status}</p>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-600">Current Phase</span>
                        <p className="text-lg font-semibold capitalize">{job.current_phase?.replace('_', ' ')}</p>
                    </div>
                </div>
                
                {/* OTP Alert */}
                {currentOtpRequest && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <span className="text-yellow-600 mr-2">📱</span>
                            <div>
                                <p className="font-medium text-yellow-800">Waiting for OTP</p>
                                <p className="text-sm text-yellow-600">
                                    {currentOtpRequest.otp_type.replace('_', ' ')} OTP requested. 
                                    Please check your SMS.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Validation Steps */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Validation Phase</h3>
                    <div className="space-y-2">
                        {getStepsByPhase('validation').map(step => (
                            <div key={step.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <span className="mr-3 text-xl">{getStepStatus(step)}</span>
                                    <span className="font-medium capitalize">{step.step_name.replace('_', ' ')}</span>
                                </div>
                                <span className="text-sm text-gray-600 capitalize">{step.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Payment Steps */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Payment Processing</h3>
                    {[1, 2, 3, 4].map(transactionIndex => {
                        const transactionSteps = steps.filter(s => s.transaction_index === transactionIndex)
                        const hasSteps = transactionSteps.length > 0
                        
                        return (
                            <div key={transactionIndex} className="mb-4">
                                <h4 className="font-medium mb-2">Transaction {transactionIndex} (₹{job.transaction_amount})</h4>
                                {hasSteps ? (
                                    <div className="space-y-2 ml-4">
                                        {transactionSteps.map(step => (
                                            <div key={step.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center">
                                                    <span className="mr-2 text-lg">{getStepStatus(step)}</span>
                                                    <span className="capitalize">{step.step_name.replace('_', ' ')}</span>
                                                </div>
                                                <span className="text-sm text-gray-600 capitalize">{step.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="ml-4 text-gray-500">Pending...</div>
                                )}
                            </div>
                        )
                    })}
                </div>
                
                {/* Error Display */}
                {job.error_message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <span className="text-red-600 mr-2">❌</span>
                            <div>
                                <p className="font-medium text-red-800">Error Occurred</p>
                                <p className="text-sm text-red-600">{job.error_message}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
```

## Key Complexity Considerations

### 1. **Parallel Processing Management**
- Gyftr and Amazon login happen simultaneously
- Need to track completion of both before proceeding
- Handle partial failures gracefully

### 2. **OTP Flow Management**
- Multiple OTP types (login, payment) with different timeouts
- SMS polling mechanism with configurable intervals
- Timeout handling and retry logic

### 3. **State Synchronization**
- Real-time updates across multiple tables
- Consistent state between job progress and step details
- Handling race conditions in concurrent updates

### 4. **Error Recovery**
- Granular error tracking per step
- Retry mechanisms with exponential backoff
- Partial completion handling (e.g., 2/4 transactions complete)

### 5. **Resource Management**
- Browser session persistence for Amazon login
- Connection pooling for database operations
- Memory management for long-running jobs

### 6. **UI Responsiveness**
- Progressive loading of step details
- Optimistic updates vs confirmed updates
- Handling network interruptions gracefully

This implementation provides a robust foundation for your payment automation system with comprehensive real-time progress tracking. 