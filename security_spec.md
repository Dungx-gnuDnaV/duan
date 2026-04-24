# Security Specification

## Data Invariants
1. **Attendance Records** must belong to an existing student.
2. **Alerts** must have a valid type (`late` or `present`) and belong to a student.
3. **Notifications** must record parents' contacts and messages correctly.
4. **Students** must belong to a class.

## The "Dirty Dozen" Payloads (Deny Cases)
1. Creating attendance for non-existent student.
2. Spoofing `verified: true` by unauthenticated user.
3. Updating an immutable attendance record.
4. Creating a notification with a 2MB message (Denial of Wallet).
5. Deleting a student record without being signed in.
6. Updating a student's `studentCode` to an invalid format.
7. Creating a class with an empty name.
8. Self-assigning admin privileges (if admin collection exists).
9. Reading all notifications without being signed in.
10. Listing all students' private data (if split).
11. Injecting script into a student name.
12. Creating a record with a future timestamp (not server timestamp).

## Test Runner Plan
We will use `firestore.rules.test.ts` to verify these.
