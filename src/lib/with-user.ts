import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./auth";
import { Session, User } from "lucia";
import { ApiError } from "./api-error";
import { HttpStatus } from "@/constants/http-status";

type WithUserHandler<T = unknown> = (props: {
  req: NextRequest;
  user: User;
  session: Session;
  params: T;
}) => Promise<NextResponse>;

export default function withUser<ParamsType = unknown>(
  handler: WithUserHandler<ParamsType>
) {
  return async function (req: NextRequest, params: ParamsType) {
    try {
      const { session, user } = await getSession();

      if (!session || !user) {
        throw new ApiError({
          message: "You are not authenticated. Please login to continue.",
          detailedMessage: "Unauthorized",
          status: HttpStatus.UNAUTHORIZED,
        });
      }

      return await handler({ req, user, session, params });
    } catch (e) {
      // TODO: can extract this to a separate function
      if (e instanceof ApiError) {
        return new Response(
          JSON.stringify({
            error: e.message,
          }),
          { status: e.status }
        );
      }

      return new Response(
        JSON.stringify({
          error: e instanceof Error ? e.message : "Unknown Error",
        }),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      );
    }
  };
}
