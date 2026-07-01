import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type UserRole = "admin" | "principal" | "parent";

const protectedPrefixes: Array<{
  prefix: string;
  role: UserRole;
}> = [
  {
    prefix: "/admin",
    role: "admin"
  },
  {
    prefix: "/principal",
    role: "principal"
  },
  {
    prefix: "/parent",
    role: "parent"
  }
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const matchedRoute = protectedPrefixes.find(({ prefix }) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (!matchedRoute) {
    return response;
  }

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);

    return NextResponse.redirect(redirectUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active,role")
    .eq("id", user.id)
    .maybeSingle<{ is_active: boolean; role: UserRole }>();

  if (!profile?.is_active || profile.role !== matchedRoute.role) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/unauthorized";
    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/principal/:path*", "/parent/:path*"]
};
