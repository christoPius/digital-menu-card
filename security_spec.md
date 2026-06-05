# Security Specification

## Data Invariants
1. **Unauthenticated Blocks**: No unauthenticated client can write, edit, or delete any category, menu item, or restaurant metadata.
2. **Branding Integrity**: Only an authenticated administrator can update the restaurant settings or branding logo.
3. **Menu Item Consistency**: A menu item must have a positive price, a valid non-empty name, and associate with an existing category.

## The Dirty Dozen (Malicious Payloads)
The following payloads attempt to violate identity, integrity, or system boundaries and MUST be rejected:

1. **Unauthenticated Menu Addition**: Anonymous user attempt to write `/menuItems/hack`
2. **Anonymous Category Deletion**: Anonymous user attempt to delete `/categories/cat-1`
3. **Privilege Escalation in profile**: Modifying user claim roles
4. **Negative Price Injection**: Menu item with negative `price` (-500)
5. **No-Name Delicacy**: Menu item with empty name string `""`
6. **Massive String Poisoning**: Menu item description exceeding size limits (e.g., 200KB junk data)
7. **Malformed Category ID**: Document ID not Matching string character rules `isValidId()`
8. **Immutability Bypass**: Trying to overwrite `createdAt` or category schema properties
9. **SQL/HTML Injection in Description**: Adding executable scripts as description attributes
10. **Restaurant Hijack**: Modifying restaurant setting name by non-admin session
11. **Spoofed Owner UID**: Creating entries with simulated `ownerId` of another administrator
12. **Status Bypass**: Bypassing checked states of items without authorization

## Security Rules Enforcement Tests
We enforce these blocks in `firestore.rules`.
