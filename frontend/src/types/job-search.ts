export type JobSearchFormValues = {
  query: string;
  location?: string;
  remoteOnly: boolean;
  jobType: "full-time" | "part-time" | "contract" | "internship";
};
