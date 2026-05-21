import { JobSpecsWizardPage } from "@/components/forms/job-specs-wizard-page";
import { PortalHeader } from "@/components/portal/portal-header";

export default function JobSpecsPage() {
  return (
    <>
      <PortalHeader
        title="Job Specs"
        subtitle="Define preferences for AI job matching and scraping"
      />
      <JobSpecsWizardPage />
    </>
  );
}
