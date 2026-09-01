import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get('sms_role')?.value;
  const studentId = req.cookies.get('sms_student_id')?.value;

  if (pathname.startsWith('/staff')) {
    if (role !== 'staff') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/student/')) {
    const requestedId = pathname.split('/')[2];

    if (role !== 'student' || !studentId) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    // A student can only view their own record — not another student's id.
    if (requestedId && requestedId !== studentId) {
      return NextResponse.redirect(new URL(`/student/${studentId}`, req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/staff/:path*', '/student/:path*'],
};
