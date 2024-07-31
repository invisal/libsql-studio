import {
  makeTestDatabase,
  makeTestUser,
  setupTestDatabase,
  testRequestApi,
} from "@/lib/test-helper";
import { POST } from "./route";
import { HttpStatus } from "@/constants/http-status";
import { RequestOperationBody } from "@/lib/api/api-request-types";

const CURRENT_USER_ID = "visal";
const CURRENT_USER_TOKEN = "visal_token";
const CURRENT_DATABASE_ID = "db_visal";
const OTHER_DATABASE_ID = "db_other";

async function request(
  sessionToken: string | undefined,
  databaseId: string,
  body?: RequestOperationBody
) {
  return testRequestApi<RequestOperationBody, { database_id: string }>(POST, {
    sessionToken: sessionToken,
    params: { database_id: databaseId },
    body,
  });
}

beforeAll(async () => {
  await setupTestDatabase();

  const user = await makeTestUser({
    id: CURRENT_USER_ID,
    sessionToken: CURRENT_USER_TOKEN,
  });

  await makeTestDatabase(user, {
    id: CURRENT_DATABASE_ID,
  });

  await makeTestDatabase(await makeTestUser({ id: "other_user" }), {
    id: OTHER_DATABASE_ID,
  });
});

describe("Collaboration", () => {
  it("user that does not have any permission SHOULD throw error", async () => {
    const { status } = await request(CURRENT_USER_TOKEN, OTHER_DATABASE_ID);
    expect(status).not.toBe(HttpStatus.OK);
  });

  it("owner of the database can execute SQL query", async () => {
    const { status } = await request(CURRENT_USER_TOKEN, CURRENT_DATABASE_ID, {
      type: "schemas",
    });

    expect(status).toBe(HttpStatus.OK);
  });
});
