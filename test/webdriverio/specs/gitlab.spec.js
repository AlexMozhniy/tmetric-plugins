describe("GitLab integration spec", function () {

  var bugTrackerUrl = 'https://gitlab.com';

  var testProjectName = 'gitlab-test-qazwsxedc';
  var testProjectSearchUrl = bugTrackerUrl + '/dashboard/projects';
  var testProjectUrl = '';

  var testIssueName = 'Issue for ' + testProjectName;
  var testIssueSearchUrl = bugTrackerUrl + '/dashboard/issues?search=' + testIssueName;
  var testIssueUrl = '';

  before(function () {

    function getTestProjectUrlFromAnchor () {
      return browser
        .getAttribute('a*=' + testProjectName, 'href')
        .then(function (result) {
          testProjectUrl = result;
        });
    }

    function getTestProjectUrlFromUrl () {
      return browser
        .url()
        .then(function (result) {
          testProjectUrl = result.value;
        });
    }

    function getTestIssueUrlFromAnchor () {
      return browser
        .getAttribute('a*=' + testIssueName, 'href')
        .then(function (result) {
          testIssueUrl = result;
        });
    }

    function getTestIssueUrlFromUrl () {
      return browser
        .url()
        .then(function (result) {
          testIssueUrl = result.value;
        });
    }

    function createTestProject () {
      return browser
        .url(bugTrackerUrl + '/projects/new')
        .setValue('#project_path', testProjectName)
        .click('.btn.btn-create')
        .waitForExist('.btn.btn-remove')
        .then(getTestProjectUrlFromUrl)
        .then(createTestIssue);
    }

    function createTestIssue () {
      return browser
        .url(testProjectUrl + '/issues/new')
        .setValue('#issue_title', testIssueName)
        .click('.btn.btn-create')
        .waitForExist('.btn.btn-close.js-note-target-close')
        .then(getTestIssueUrlFromUrl);
    }

    function checkTestIssue () {
      return browser
        .url(testProjectUrl + '/issues')
        .isExisting('a*=' + testIssueName).then(function (result) {
          return (result ? getTestIssueUrlFromAnchor : createTestIssue)();
        });
    }

    function checkTestProject () {
      return browser
        .url(testProjectSearchUrl)
        .isExisting('a*=' + testProjectName)
        .then(function (result) {
          return (result ? function () {
            return browser
              .then(getTestProjectUrlFromAnchor)
              .then(checkTestIssue);
          } : createTestProject)();
        });
    }

    function searchTestIssue () {
      return browser
        .url(testIssueSearchUrl)
        .isExisting('a*=' + testIssueName).then(function (result) {
          return (result ? getTestIssueUrlFromAnchor : checkTestProject)();
        });      
    }

    return browser
      .login("GitLab")
      .then(searchTestIssue)
      .then(function () {
        expect(testIssueUrl).not.to.be.empty;
      });

  });

  it("can start tracking time on a task from GitLab test project", function () {

    var projectName, issueName, issueUrl;

    return browser
      .url(testIssueUrl)
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getText('.title a:nth-last-child(2)').then(function (text) {
        projectName = text;
      })
      .getText('.issue-title').then(function (text) {
        issueName = text;
      })
      .url().then(function (result) {
        issueUrl = result.value;
      })
      .then(function () {
        expect(projectName).to.be.equal(testProjectName);
        expect(issueName).to.be.equal(testIssueName);
        expect(issueUrl).to.be.equal(testIssueUrl);
      })
      .then(function () {
        return browser.startAndTestTaskStarted(projectName, issueName, issueUrl);
      });

  });

  it("can stop tracking time on a task from GitLab test project", function () {
    return browser
      .url(testIssueUrl)
      .stopAndTestTaskStopped();
  });

});
