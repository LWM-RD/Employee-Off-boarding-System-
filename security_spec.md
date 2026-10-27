# Security Specification: Employee Offboarding Tracker

## 1. Data Invariants
1. **Domain Boundary Invariant**: Only authenticated users with an authorized email domain (e.g. `@mycompany.com`) or recorded in the `/admins` collection can read or write offboarding records.
2. **Immutable Identity Invariant**: An offboarding record's `createdBy` and `createdAt` fields are strictly immutable after creation.
3. **No Blanket Access**: Unauthenticated requests and users outside the designated tenant domain are denied all read and write privileges.
4. **Admin-Only Template Editing**: Checklist templates `/templates/{templateId}` can only be created, modified, or deleted by users present in `/admins/{uid}`.
5. **Admin-Only Deletions**: Deletion of offboarding records `/offboardings/{offboardingId}` is strictly restricted to verified Admins (`isAdmin()`).
6. **No Client Side Delegation**: Query listings (`allow list`) must evaluate authentication state and verify non-null tenant credentials.
7. **Strict Field Validation**: Offboarding records cannot contain unauthorized fields or oversized payload injections.

---

## 2. The "Dirty Dozen" Attack Payloads

1. **Anonymous Read Attack**: Unauthenticated user queries `/offboardings` collection. Expected: `PERMISSION_DENIED`.
2. **External Domain Write Attack**: User with valid Firebase token but email `attacker@randommail.com` attempts to create an offboarding record. Expected: `PERMISSION_DENIED`.
3. **Ghost / Shadow Field Injection**: Malicious payload in `create` containing `{ ...validFields, isSystemSuperUser: true }`. Expected: `PERMISSION_DENIED`.
4. **Path ID Poisoning Attack**: Attempt to create document with 1500-character junk string as `offboardingId`. Expected: `PERMISSION_DENIED`.
5. **Non-Admin Template Overwrite**: Regular authenticated employee attempts to write to `/templates/default`. Expected: `PERMISSION_DENIED`.
6. **Non-Admin Record Delete**: Non-admin user attempts to `DELETE` `/offboardings/rec-123`. Expected: `PERMISSION_DENIED`.
7. **Immutable Timestamp Mutation**: Attempt to modify `createdAt` or replace `createdBy` during an `update` operation. Expected: `PERMISSION_DENIED`.
8. **Denial-of-Wallet Payload Attack**: Attempting to save a 500KB text blob in `employeeName` or `department`. Expected: `PERMISSION_DENIED`.
9. **Status State Shortcutting with Invalid Enum**: Attempting to set `status` to `"hacked"` or arbitrary string outside allowed enums. Expected: `PERMISSION_DENIED`.
10. **Unverified Email Spoofing Attack**: Request where `auth.token.email` ends in target domain but `auth.token.email_verified == false`. Expected: `PERMISSION_DENIED`.
11. **Self-Escalation Admin Inject**: User attempts to create `/admins/{their_uid}` without existing superadmin privilege. Expected: `PERMISSION_DENIED`.
12. **Blanket Query Scraping**: Malicious client bypassing where clauses to harvest all records without domain authorization. Expected: `PERMISSION_DENIED`.

---

## 3. Test Runner Design (`firestore.rules.test.ts`)
The security tests verify that all 12 dirty dozen payloads are blocked with `PERMISSION_DENIED` and only authorized operations succeed.
