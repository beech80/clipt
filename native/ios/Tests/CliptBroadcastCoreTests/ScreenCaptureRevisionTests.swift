import XCTest
@testable import CliptBroadcastCore

final class ScreenCaptureRevisionTests: XCTestCase {
    func testCaptureCannotStartBeforeConsentFlowBeginsOrAfterItStops() throws {
        var revision = ScreenCaptureRevision()
        XCTAssertNil(revision.requestChange())
        revision.begin()
        let selected = try XCTUnwrap(revision.requestChange())
        XCTAssertTrue(revision.accepts(selected))
        revision.stop()
        XCTAssertFalse(revision.accepts(selected))
        XCTAssertNil(revision.requestChange())
    }

    func testLatestPickerChoiceInvalidatesAnEarlierAsynchronousStart() throws {
        var revision = ScreenCaptureRevision()
        revision.begin()
        let first = try XCTUnwrap(revision.requestChange())
        let second = try XCTUnwrap(revision.requestChange())
        XCTAssertFalse(revision.accepts(first))
        XCTAssertTrue(revision.accepts(second))
    }

    func testNewConsentCannotReviveWorkFromAnEndedBroadcast() throws {
        var revision = ScreenCaptureRevision()
        revision.begin()
        let old = try XCTUnwrap(revision.requestChange())
        revision.stop()
        revision.begin()
        let current = try XCTUnwrap(revision.requestChange())
        XCTAssertFalse(revision.accepts(old))
        XCTAssertTrue(revision.accepts(current))
    }
}
