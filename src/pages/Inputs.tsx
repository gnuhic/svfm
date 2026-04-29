import { useState } from 'react'
import { FiscalContextSection } from '@/components/inputs/FiscalContextSection'
import { VacanciesSection } from '@/components/inputs/VacanciesSection'
import { UnplannedLeaveSection } from '@/components/inputs/UnplannedLeaveSection'
import { PlannedLeaveSection } from '@/components/inputs/PlannedLeaveSection'
import { PayAdjustmentsSection } from '@/components/inputs/PayAdjustmentsSection'

type InputSectionId =
  | 'fiscalContext'
  | 'vacancies'
  | 'unplannedLeave'
  | 'plannedLeave'
  | 'payAdjustments'

export default function Inputs() {
  const [activeSection, setActiveSection] = useState<InputSectionId>('fiscalContext')

  const toggleSection = (section: InputSectionId) => {
    setActiveSection((current) => (current === section ? current : section))
  }

  return (
    <div className="space-y-6 p-8">
      <FiscalContextSection
        collapsed={activeSection !== 'fiscalContext'}
        onToggle={() => toggleSection('fiscalContext')}
      />
      <VacanciesSection
        collapsed={activeSection !== 'vacancies'}
        onToggle={() => toggleSection('vacancies')}
      />
      <UnplannedLeaveSection
        collapsed={activeSection !== 'unplannedLeave'}
        onToggle={() => toggleSection('unplannedLeave')}
      />
      <PlannedLeaveSection
        collapsed={activeSection !== 'plannedLeave'}
        onToggle={() => toggleSection('plannedLeave')}
      />
      <PayAdjustmentsSection
        collapsed={activeSection !== 'payAdjustments'}
        onToggle={() => toggleSection('payAdjustments')}
      />
    </div>
  )
}
