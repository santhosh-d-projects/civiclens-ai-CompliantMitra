import { NextResponse } from "next/server";

const MAP: Record<string, number> = {
  ADMIN_ONLY: 403, MAKER_CHECKER: 403, NOT_AN_OFFICER: 403, DEPARTMENT_NOT_ACTIVE: 403,
  ILLEGAL_TRANSITION: 409, TARGET_NOT_ACTIVE: 409,
  REASON_REQUIRED: 422, DOCUMENTS_NOT_VERIFIED: 422, NO_OFFICER: 422, TARGET_REQUIRED: 422,
  TARGET_DOES_NOT_COVER: 422, DEPARTMENT_DOES_NOT_COVER_WARD: 422, DEPARTMENT_DOES_NOT_HANDLE_CATEGORY: 422,
  RESOLUTION_NOTE_REQUIRED: 422, NOT_FOUND: 404,
};
export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}
export function fromDbError(e: unknown) {
  const msg = (e as any)?.message ? String((e as any).message) : e instanceof Error ? e.message : String(e ?? "unknown error");
  for (const code of Object.keys(MAP)) if (msg.includes(code)) return apiError(code, msg, MAP[code]);
  return apiError("DB_ERROR", msg, 500);
}
