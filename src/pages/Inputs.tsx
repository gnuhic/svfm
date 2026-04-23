import { FiscalContextSection } from '@/components/inputs/FiscalContextSection'
import { VacanciesSection } from '@/components/inputs/VacanciesSection'
import { UnplannedLeaveSection } from '@/components/inputs/UnplannedLeaveSection'
import { PlannedLeaveSection } from '@/components/inputs/PlannedLeaveSection'
import { PayAdjustmentsSection } from '@/components/inputs/PayAdjustmentsSection'

export default function Inputs() {
  return (
    <div className="space-y-6 p-8">
      <FiscalContextSection />
      <VacanciesSection />
      <UnplannedLeaveSection />
      <PlannedLeaveSection />
      <PayAdjustmentsSection />
    </div>
  )
}
