import assert from "node:assert/strict";
import { afterEach, before, mock, test } from "node:test";
import { verifyGoogleIdToken, type GoogleIdentity } from "../config/google";
import { User } from "../models";
import { linkGoogleAccount, loginWithGoogle } from "../services/auth";
import { HttpError } from "../utils/http";
import app from "../app";

const identity: GoogleIdentity = {
  subject: "google-subject-1",
  email: "person@example.com",
  name: "Google Person",
  picture: "https://example.com/avatar.png",
};

const verify = async (): Promise<GoogleIdentity> => identity;

const userModel = User as unknown as {
  findOne(...args: unknown[]): unknown;
  exists(...args: unknown[]): unknown;
  create(...args: unknown[]): unknown;
  findById(...args: unknown[]): unknown;
};

const fakeUser = (overrides: Record<string, unknown> = {}) => ({
  id: "507f1f77bcf86cd799439011",
  name: "Existing User",
  email: identity.email,
  role: "organizer",
  isActive: true,
  avatar: undefined,
  googleId: identity.subject,
  save: async function () {
    return this;
  },
  ...overrides,
});

before(() => {
  process.env.JWT_SECRET = "google-auth-tests-secret";
  process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
});

afterEach(() => mock.restoreAll());

test("rejects malformed Google ID tokens", async () => {
  await assert.rejects(
    () => verifyGoogleIdToken("not-a-google-id-token"),
    (error: unknown) =>
      error instanceof HttpError && error.statusCode === 401,
  );
});

test("creates new Google accounts as attendees without a password", async () => {
  mock.method(userModel, "findOne", async () => null);
  mock.method(userModel, "exists", async () => null);
  let created: Record<string, unknown> | undefined;
  mock.method(userModel, "create", async (...args: unknown[]) => {
    const input = args[0] as Record<string, unknown>;
    created = input;
    return fakeUser({ ...input, role: "attendee" });
  });

  const result = await loginWithGoogle("credential", verify);

  assert.equal(result.user.role, "attendee");
  assert.equal(created?.googleId, identity.subject);
  assert.equal(created?.password, undefined);
  assert.equal(created?.avatar, undefined);
});

test("preserves the role of an existing linked account", async () => {
  mock.method(userModel, "findOne", async () => fakeUser());

  const result = await loginWithGoogle("credential", verify);

  assert.equal(result.user.role, "organizer");
});

test("rejects inactive linked accounts", async () => {
  mock.method(userModel, "findOne", async () =>
    fakeUser({ isActive: false }),
  );

  await assert.rejects(
    () => loginWithGoogle("credential", verify),
    (error: unknown) =>
      error instanceof HttpError && error.statusCode === 403,
  );
});

test("requires authenticated linking when the email already exists", async () => {
  mock.method(userModel, "findOne", async () => null);
  mock.method(userModel, "exists", async () => ({ _id: "existing" }));

  await assert.rejects(
    () => loginWithGoogle("credential", verify),
    (error: unknown) =>
      error instanceof HttpError &&
      error.code === "GOOGLE_ACCOUNT_LINK_REQUIRED",
  );
});

test("links Google only after matching the authenticated account email", async () => {
  const user = fakeUser({ googleId: undefined });
  mock.method(userModel, "findById", () => ({
    select: async () => user,
  }));
  mock.method(userModel, "findOne", async () => null);

  const linked = await linkGoogleAccount(user.id, "credential", verify);

  assert.equal(linked.googleId, identity.subject);
  assert.equal(linked.role, "organizer");
});

test("does not link a Google identity with a different email", async () => {
  const user = fakeUser({ email: "different@example.com", googleId: undefined });
  mock.method(userModel, "findById", () => ({
    select: async () => user,
  }));

  await assert.rejects(
    () => linkGoogleAccount(user.id, "credential", verify),
    (error: unknown) =>
      error instanceof HttpError && error.statusCode === 409,
  );
});

test("keeps Google linking and admin APIs protected", async () => {
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const address = server.address();
    assert(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const [linkResponse, adminResponse] = await Promise.all([
      fetch(`${baseUrl}/api/auth/google/link`, { method: "POST" }),
      fetch(`${baseUrl}/api/admin/dashboard`),
    ]);

    assert.equal(linkResponse.status, 401);
    assert.equal(adminResponse.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
