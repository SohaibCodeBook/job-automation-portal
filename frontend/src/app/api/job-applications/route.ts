import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPostgres } from "@/lib/db/postgres";
import {
  parseJobApplicationBody,
  toJobApplicationsRow,
} from "@/lib/schemas/job-application-api";

function badRequest(message: string) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication required. Sign in and try again.",
        data: null,
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const parsed = parseJobApplicationBody(body);
  if (!parsed.ok) {
    return badRequest(parsed.errors);
  }

  const row = toJobApplicationsRow(parsed.data);

  const sql = getPostgres();

  const payPayload =
    row.pay_range_filter && typeof row.pay_range_filter === "object"
      ? sql.json(JSON.parse(JSON.stringify(row.pay_range_filter)))
      : null;

  try {
    const rows = await sql`
      insert into job_applications (
        first_name,
        last_name,
        selected_industries,
        industry_names_from_naics,
        remote,
        hybrid,
        job_type,
        experience_levels,
        omit_words,
        must_include,
        desired_job_title_1,
        selected_cities,
        selected_states,
        selected_regions,
        pay_range_filter,
        resume_url,
        limit_jobs,
        user_id
      )
      values (
        ${row.first_name},
        ${row.last_name},
        ${row.selected_industries},
        ${row.industry_names_from_naics},
        ${row.remote},
        ${row.hybrid},
        ${row.job_type},
        ${row.experience_levels},
        ${row.omit_words},
        ${row.must_include},
        ${row.desired_job_title_1},
        ${row.selected_cities},
        ${row.selected_states},
        ${row.selected_regions},
        ${row.pay_range_filter === null || row.pay_range_filter === undefined ? null : payPayload},
        ${row.resume_url},
        ${row.limit_jobs},
        ${userId}::uuid
      )
      returning id::text as id
    `;

    const id = rows[0]?.id as string | undefined;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Database insert returned no row data.",
          data: null,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job application created successfully",
      data: { id },
    });
  } catch (err) {
    console.error("[job-applications] insert failed", err);
    return NextResponse.json(
      {
        success: false,
        message:
          "Database insert failed. Check server logs and database permissions.",
        data: null,
      },
      { status: 500 },
    );
  }
}
