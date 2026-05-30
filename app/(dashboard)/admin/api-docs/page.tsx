'use client'

import dynamic from 'next/dynamic'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

// Dynamic import to avoid SSR issues with swagger-ui-react
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
})

/**
 * API documentation page using embedded Swagger UI.
 * Loads the OpenAPI spec from /docs/openapi.yaml.
 * Admin only.
 */
export default function ApiDocsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageHeader
        title="Dokumentasi API"
        description="Referensi lengkap semua endpoint REST API TeleMed Desa"
      />
      <div className="rounded-xl border border-border-green overflow-hidden bg-card">
        <SwaggerUI url="/docs/openapi.yaml" />
      </div>
    </RoleGuard>
  )
}
