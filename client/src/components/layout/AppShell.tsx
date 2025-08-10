import { Suspense, lazy, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load all page components for better performance
const Customers = lazy(() => import('@/pages/Customers'))
const Jobs = lazy(() => import('@/pages/Jobs'))
const Estimates = lazy(() => import('@/pages/Estimates'))
const LeadManagement = lazy(() => import('@/pages/LeadManagement'))
const Contacts = lazy(() => import('@/pages/Contacts'))
const Communication = lazy(() => import('@/pages/Communication'))
const Reports = lazy(() => import('@/pages/Reports'))
const EditCustomer = lazy(() => import('@/pages/EditCustomer'))
const LeadDetail = lazy(() => import('@/pages/LeadDetail'))
const ProposalView = lazy(() => import('@/pages/ProposalView'))

export default function AppShell() {
  const currentPath = window.location.pathname
  
  // Extract division and section from URL path: /:division/:section
  const pathSegments = currentPath.split('/').filter(Boolean)
  const division = pathSegments[0] || 'mfnc'
  const section = pathSegments[1] || 'customers'
  
  console.log('AppShell DEBUG:', {
    currentPath,
    pathSegments,
    division,
    section
  })



  // Loading skeleton component
  const PageSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4 py-3">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Render the appropriate component based on the route with suspense
  const renderContent = () => {
    // Handle edit routes
    if (currentPath.includes('/customers/edit/')) {
      return (
        <Suspense fallback={<PageSkeleton />}>
          <EditCustomer />
        </Suspense>
      )
    }
    
    // Handle lead detail route
    if (currentPath.includes('/lead-management/lead/')) {
      return (
        <Suspense fallback={<PageSkeleton />}>
          <LeadDetail />
        </Suspense>
      )
    }
    
    // Handle proposal view route
    if (currentPath.includes('/proposal/') && pathSegments[1] === 'proposal') {
      return (
        <Suspense fallback={<PageSkeleton />}>
          <ProposalView />
        </Suspense>
      )
    }
    
    if (currentPath.includes('/jobs/edit/')) {
      return <div className="text-center py-8 text-slate-500">Edit Job (Coming Soon)</div>
    }
    if (currentPath.includes('/estimates/edit/')) {
      return <div className="text-center py-8 text-slate-500">Edit Estimate (Coming Soon)</div>
    }

    // Handle main sections with suspense for lazy loading
    const ComponentToRender = (() => {
      console.log('DEBUG - Current section:', section, 'Full path:', currentPath, 'Division:', division) // Debug log
      
      switch (section) {
        case 'customers': 
          console.log('Loading Customers component')
          return Customers
        case 'jobs': 
          console.log('Loading Jobs component')
          return Jobs
        case 'estimates': 
          console.log('Loading Estimates component')
          return Estimates
        case 'lead-management': 
          console.log('Loading LeadManagement component')
          return LeadManagement
        case 'pipeline': 
          console.log('Loading LeadManagement component (backward compatibility)')
          return LeadManagement // backward compatibility
        case 'proposals': 
          console.log('Loading LeadManagement component (proposals redirect)')
          return LeadManagement // redirect to lead management
        case 'contracts': 
          console.log('Loading LeadManagement component (contracts redirect)')
          return LeadManagement // redirect to lead management
        case 'contacts': 
          console.log('Loading Contacts component')
          return Contacts
        case 'communication': 
          console.log('Loading Communication component')
          return Communication
        case 'reports': 
          console.log('Loading Reports component')
          return Reports
        default: 
          console.log('No match found for section:', section, 'defaulting to Customers')
          return Customers
      }
    })()

    return (
      <Suspense fallback={<PageSkeleton />}>
        <ComponentToRender />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="p-6 lg:p-8 max-w-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}