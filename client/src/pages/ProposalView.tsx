import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Send, Edit, Check, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ProposalView() {
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const proposalId = (params as any).proposalId
  const division = (params as any).division || 'mfnc'

  const { data: proposal, isLoading } = useQuery({
    queryKey: ['proposals', proposalId],
    queryFn: () => apiRequest(`/api/trpc/proposals.getById?id=${proposalId}`),
    enabled: !!proposalId,
    select: (data: any) => data || {}
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Proposal not found</p>
        <Button 
          variant="outline" 
          onClick={() => navigate({ to: `/${division}/lead-management` })}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lead Management
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const projectInclusions = Array.isArray(proposal?.projectInclusions) 
    ? proposal.projectInclusions 
    : []

  const projectExclusions = Array.isArray(proposal?.projectExclusions) 
    ? proposal.projectExclusions 
    : []

  const baseExclusions = Array.isArray(proposal?.baseExclusions) 
    ? proposal.baseExclusions 
    : []

  const options = Array.isArray(proposal?.options) 
    ? proposal.options 
    : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: `/${division}/lead-management` })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {proposal?.title || 'Proposal'}
              </h1>
              <p className="text-sm text-gray-500">
                Created {formatDate(proposal?.createdAt || new Date().toISOString())}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge className={getStatusColor(proposal?.status || 'draft')}>
              {(proposal?.status || 'draft').charAt(0).toUpperCase() + (proposal?.status || 'draft').slice(1)}
            </Badge>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              {(proposal?.status || 'draft') === 'draft' && (
                <Button size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send Proposal
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Content */}
      <div className="max-w-4xl mx-auto py-8 px-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-12 proposal-content">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                EXTERIOR FINISHES
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Vendor Pricing Valid {proposal?.validDays || 60} Days Unless Noted Otherwise.
              </p>
            </div>

            {/* Project Details */}
            <div className="mb-8 space-y-2">
              <p><strong>Date:</strong> {formatDate(proposal?.createdAt || new Date().toISOString())}</p>
              <p><strong>Homeowner:</strong> {proposal?.homeowner || 'N/A'}</p>
              <p><strong>Address:</strong> {proposal?.address || 'N/A'}</p>
            </div>

            {/* Project Description */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4">Project Inclusions:</h2>
              <p className="mb-6">{proposal?.projectDescription || 'No description provided'}</p>

              {/* Inclusions List */}
              <div className="space-y-4">
                {projectInclusions.map((inclusion, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {inclusion}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {getInclusionDetails(inclusion)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Base Cost */}
            <div className="mb-8 py-4 border-t border-b border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-lg font-bold">
                  Total Cost to Supply and Install Items Listed W/O WSST: {formatCurrency((proposal?.baseCostCents || 0) / 100)}
                </p>
              </div>
            </div>

            {/* Options */}
            {options.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4">Project Specific Options:</h2>
                <div className="space-y-6">
                  {options.map((option, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {option.name}:
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {option.description}
                      </p>
                      <p className="font-semibold">
                        Total Cost for {option.name}: {formatCurrency((option.costCents || 0) / 100)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exclusions */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4">Project Specific Exclusions:</h2>
              <ul className="list-disc list-inside space-y-1 mb-6">
                {projectExclusions.map((exclusion, index) => (
                  <li key={index} className="text-sm">{exclusion}</li>
                ))}
              </ul>

              <h3 className="font-semibold mb-2">Base Exclusions:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {baseExclusions.map((exclusion, index) => (
                  <li key={index}>{exclusion}</li>
                ))}
              </ul>
            </div>

            {/* Insurance */}
            {proposal?.insuranceLimits && (
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4">Exterior Finishes Insurance Limits</h2>
                <div className="whitespace-pre-line text-sm">
                  {proposal.insuranceLimits}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            {proposal?.additionalNotes && (
              <div className="mb-8">
                <div className="whitespace-pre-line text-sm">
                  {proposal.additionalNotes}
                </div>
              </div>
            )}

            {/* Signature */}
            <div className="mt-12">
              <p className="mb-8">Sincerely,</p>
              <p className="font-semibold">
                {proposal?.createdByUser?.name || 'Anthony Hutchinson'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper function for inclusion details
function getInclusionDetails(inclusion: string): string {
  const details: Record<string, string> = {
    'Complete Removal of Existing Siding': '• Full tear-off of all existing siding, corner trims, and related materials.\n• Debris removal and proper disposal included.',
    'Inspection of Substrate': '• Visual inspection of exposed sheathing once siding is removed.\n• Any required substrate repairs will be quoted at a T&M rate of $125/hr',
    'Weather Barrier Installation': '• Installation of code-compliant weather-resistive barrier (WRB) over all wall surfaces.\n• Proper taping and sealing around all seams and openings.',
    'Flashing & Waterproofing': '• New flashing installed at all windows, doors, and wall penetrations.\n• Kick-out flashing and roof-to-wall integration where applicable.',
    'Siding Installation': '• Installation of new James Hardie ColorPlus siding (color TBD).\n• Final profile and style to be selected by homeowner prior to material order.',
    'Trim Details': '• ColorPlus Hardie trim installed at windows, doors, corners, and horizontal transitions.',
    'Caulking and Sealing': '• Application of high-quality, color-matched sealant at all necessary joints and transitions.',
    'Fasteners & Accessories': '• Use of corrosion-resistant fasteners and manufacturer-approved accessories.',
    'Final Clean-Up': '• Jobsite cleaned daily, full debris removal and magnetic nail sweep upon completion.'
  }
  
  return details[inclusion] || ''
}