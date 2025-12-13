import { cookies } from 'next/headers';
import { getUsersProjection } from '@/lib/domain/userManagement/user-projection';

export async function resolveCompanyId(searchParams: URLSearchParams): Promise<string | undefined> {
  const companyIdFromQuery = searchParams.get('companyId');
  if (companyIdFromQuery) {
    return companyIdFromQuery;
  }

  const users = await getUsersProjection();
  const cookieStore = await cookies();
  const userIdFromCookie = cookieStore.get('userId')?.value;

  if (!userIdFromCookie) {
    return undefined;
  }

  const user = users.find(u => u.userId === userIdFromCookie);
  return user?.companyId;
}
