# Coverage Analysis Script
coverage_data = {
    "TASK-001": {"title": "Job Feed Tab Navigation", "tests": ["test_flows.py:Step3", "test_home_redesign.py"], "strength": "strong"},
    "TASK-002": {"title": "Report & Safety Incident Workflow", "tests": ["test_flows.py:Step4"], "strength": "strong"},
    "TASK-003": {"title": "Chat Auto-Replies", "tests": ["test_flows.py:Step6", "test_advanced_features.py:Test8"], "strength": "strong"},
    "TASK-004": {"title": "Fair Pay & Hourly Rate Widget", "tests": ["test_flows.py:Step7", "test_advanced_features.py:Test3"], "strength": "strong"},
    "TASK-005": {"title": "Guardian Consent Portal", "tests": ["test_compliance.py:Test4", "test_advanced_features.py:Test4"], "strength": "strong"},
    "TASK-006": {"title": "Photo Proof/Before-After (BACKLOG)", "tests": [], "strength": "none"},
    "TASK-007": {"title": "Live Check-In & SOS (BACKLOG)", "tests": ["test_advanced_features.py:Test8"], "strength": "partial"},
    "TASK-008": {"title": "Saved Jobs/Bookmarks", "tests": ["test_flows.py:Step3,8", "test_home_redesign.py"], "strength": "strong"},
    "TASK-009": {"title": "Youth Protection Filter Non-deactivatable", "tests": ["test_flows.py:Step3", "test_compliance.py:Test1,2,3", "test_home_redesign.py"], "strength": "strong"},
    "TASK-010": {"title": "Legal Eligibility Engine (4-Tier)", "tests": ["test_compliance.py:Test1,2,3"], "strength": "strong"},
    "TASK-011": {"title": "Versioned Legal Docs & AGB", "tests": ["test_compliance.py:Test5", "test_auth.py:Test3"], "strength": "strong"},
    "TASK-012": {"title": "TDDDG Consent Manager", "tests": ["test_compliance.py:Test6"], "strength": "strong"},
    "TASK-013": {"title": "GDPR Rights & Fiscal Retention", "tests": ["test_compliance.py:Test7", "test_auth.py:Test10"], "strength": "strong"},
    "TASK-014": {"title": "Adversarial Compliance Suite", "tests": ["test_compliance.py (all 8)"], "strength": "strong"},
    "TASK-015": {"title": "Production Auth System", "tests": ["test_auth.py (all 10)"], "strength": "strong"},
}

print("=== COVERAGE MATRIX ===")
for task_id, info in coverage_data.items():
    tests_str = ", ".join(info["tests"]) if info["tests"] else "NONE"
    print(f"{task_id}: {info['title']}")
    print(f"  Tests: {tests_str}")
    print(f"  Strength: {info['strength']}")
    print()

gaps = [
    {"id": "GAP-001", "risk": "CRITICAL", "feature": "Unauthenticated API Access", "description": "No systematic test that ALL protected endpoints return 401 when unauthenticated. Only login tested.", "files_affected": "All API endpoints"},
    {"id": "GAP-002", "risk": "CRITICAL", "feature": "Expired Session Handling", "description": "No test for session expiry mid-flow (token expiry, cookie expiry, server-side revocation). Test 6 in test_auth.py tests reload but not expiry.", "files_affected": "test_auth.py"},
    {"id": "GAP-003", "risk": "HIGH", "feature": "IDOR/Horizontal Privilege Escalation", "description": "No test for accessing other users' job applications, chat threads, profile data, escrow. Security audit tests session tampering but not object-level authorization.", "files_affected": "All user-scoped endpoints"},
    {"id": "GAP-004", "risk": "HIGH", "feature": "Guardian PIN Security", "description": "test_advanced_features.py tests correct PIN but not: wrong PIN rejection, PIN brute force, PIN bypass, PIN lockout.", "files_affected": "test_advanced_features.py"},
    {"id": "GAP-005", "risk": "HIGH", "feature": "Rate Limiting on All Auth Endpoints", "description": "Only login endpoint rate limited in tests. Registration, forgot-password, reset-password, verify-email, resend-verification not tested.", "files_affected": "test_auth.py, test_security_audit.py"},
    {"id": "GAP-006", "risk": "HIGH", "feature": "Under-13 Complete Feature Block", "description": "test_compliance.py Test 1 only tests job application. Under-13 should be blocked from: chat, job creation, profile wallet, bookmarks, map, everything.", "files_affected": "test_compliance.py"},
    {"id": "GAP-007", "risk": "MEDIUM", "feature": "Legal Document Version Upgrade & Re-acceptance", "description": "No test for what happens when AGB/Privacy version changes - user must re-accept. No migration test.", "files_affected": "test_compliance.py, test_auth.py"},
    {"id": "GAP-008", "risk": "MEDIUM", "feature": "Youth Protection API Bypass", "description": "Tests only verify UI filter. No test for direct API calls to applyToJob, createJob with age-inappropriate jobs bypassing store.filter.", "files_affected": "test_compliance.py, test_flows.py"},
    {"id": "GAP-009", "risk": "MEDIUM", "feature": "Account Deletion with Active Escrow/Jobs", "description": "test_auth.py Test 10 tests deletion but user has no active jobs/escrow. Need test with active escrow balance, assigned jobs.", "files_affected": "test_auth.py"},
    {"id": "GAP-010", "risk": "MEDIUM", "feature": "Concurrent Session Limits & Session Fixation", "description": "No test for: max concurrent sessions, session fixation on login, session rotation on privilege change.", "files_affected": "test_auth.py"},
    {"id": "GAP-011", "risk": "MEDIUM", "feature": "Password/Email Token Expiry", "description": "Tests verify single-use but not time-based expiry (e.g., 24h for email verification, 1h for password reset).", "files_affected": "test_auth.py"},
    {"id": "GAP-012", "risk": "MEDIUM", "feature": "Consent Banner Re-appearance", "description": "test_compliance.py tests reject but not that banner re-appears on next visit or after cache clear.", "files_affected": "test_compliance.py"},
    {"id": "GAP-013", "risk": "LOW", "feature": "Multi-tab Session Consistency", "description": "No test for session state sync across multiple tabs.", "files_affected": "test_auth.py"},
    {"id": "GAP-014", "risk": "LOW", "feature": "XSS/Injection in Chat/Job Description", "description": "No test for script injection in chat messages, job titles, descriptions, review comments.", "files_affected": "test_flows.py, test_advanced_features.py"},
    {"id": "GAP-015", "risk": "LOW", "feature": "File Upload Validation", "description": "Photo proof feature (BACKLOG) - no validation tests for file type, size, malware.", "files_affected": "N/A (BACKLOG)"},
]

print("\n=== TOP 15 GAPS RANKED BY RISK ===")
for g in gaps:
    print(f"{g['id']} [{g['risk']}] {g['feature']}: {g['description']}")

flaky = [
    {"file": "test_flows.py", "line": 398, "issue": "nth-of-type selector", "code": "page.click('.job-card:nth-of-type(1) .bookmark-btn')", "fix": "Use data-job-id or stable selector"},
    {"file": "test_flows.py", "line": 400, "issue": "nth-of-type selector", "code": "page.click('.job-card:nth-of-type(2) .bookmark-btn')", "fix": "Use data-job-id or stable selector"},
    {"file": "test_flows.py", "line": 255, "issue": "Fixed sleep for auto-reply", "code": "page.wait_for_timeout(1200)", "fix": "Wait for chat bubble count change or specific text"},
    {"file": "test_flows.py", "line": 97, "issue": "Fixed sleep", "code": "page.wait_for_timeout(300)", "fix": "Wait for navigation/state change"},
    {"file": "test_flows.py", "line": 109, "issue": "Multiple fixed sleeps for filter pills", "code": "page.wait_for_timeout(300) x4", "fix": "Wait for filter state change"},
    {"file": "test_compliance.py", "line": 39, "issue": "Fixed sleep after persona switch", "code": "page.wait_for_timeout(300)", "fix": "Wait for store state update"},
    {"file": "test_auth.py", "line": 280, "issue": "Fixed sleep after login", "code": "page.wait_for_timeout(1000)", "fix": "Wait for isAuthenticated state"},
    {"file": "test_auth.py", "line": 296, "issue": "Fixed sleeps for reload", "code": "page.wait_for_timeout(1200), page.wait_for_timeout(1000)", "fix": "Wait for store hydration"},
    {"file": "test_advanced_features.py", "line": 50, "issue": "Fixed sleep after login", "code": "page.wait_for_timeout(300)", "fix": "Wait for specific element"},
    {"file": "test_home_redesign.py", "line": 154, "issue": "Fixed sleep for viewport resize", "code": "page.wait_for_timeout(250)", "fix": "Wait for layout stable"},
]

print("\n=== FLAKY PATTERNS ===")
for f in flaky:
    print(f"{f['file']}:{f.get('line','?')} - {f['issue']}: {f['code']} -> {f['fix']}")