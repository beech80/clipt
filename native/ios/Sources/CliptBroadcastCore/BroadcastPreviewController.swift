#if os(iOS)
import UIKit
import HaishinKit

@MainActor
final class BroadcastPreviewController: UIViewController {
    let videoView = MTHKView(frame: .zero)
    private weak var engine: CliptBroadcastEngine?
    private let statusLabel = UILabel()
    private let muteButton = UIButton(type: .system)
    private let switchButton = UIButton(type: .system)
    private let endButton = UIButton(type: .system)
    private var isMuted = false

    init(engine: CliptBroadcastEngine) {
        self.engine = engine
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .fullScreen
        isModalInPresentation = true
    }
    required init?(coder: NSCoder) { nil }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        videoView.videoGravity = .resizeAspect
        videoView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(videoView)
        statusLabel.font = .preferredFont(forTextStyle: .headline)
        statusLabel.adjustsFontForContentSizeCategory = true
        statusLabel.textColor = .white
        statusLabel.numberOfLines = 0
        statusLabel.accessibilityTraits = .updatesFrequently
        setStatus(engine?.state ?? "connecting")
        isMuted = engine?.microphoneIsMuted ?? true
        configure(muteButton, title: isMuted ? "Unmute microphone" : "Mute microphone", action: #selector(toggleMute))
        muteButton.isEnabled = engine?.microphoneAllowed == true
        configure(switchButton, title: "Switch camera", action: #selector(switchCamera))
        switchButton.isEnabled = engine?.capabilities()["cameraSwitch"] as? Bool == true
        configure(endButton, title: "End broadcast", action: #selector(endBroadcast))
        endButton.backgroundColor = .systemRed
        let controls = UIStackView(arrangedSubviews: [statusLabel, muteButton, switchButton, endButton])
        controls.axis = .vertical
        controls.spacing = 12
        controls.translatesAutoresizingMaskIntoConstraints = false
        controls.backgroundColor = UIColor.black.withAlphaComponent(0.8)
        controls.isLayoutMarginsRelativeArrangement = true
        controls.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 12, leading: 12, bottom: 12, trailing: 12)
        view.addSubview(controls)
        NSLayoutConstraint.activate([
            videoView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            videoView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            videoView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            videoView.bottomAnchor.constraint(equalTo: controls.topAnchor),
            controls.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 12),
            controls.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -12),
            controls.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -8)
        ])
    }

    private func configure(_ button: UIButton, title: String, action: Selector) {
        button.setTitle(title, for: .normal)
        button.titleLabel?.font = .preferredFont(forTextStyle: .body)
        button.titleLabel?.adjustsFontForContentSizeCategory = true
        button.titleLabel?.numberOfLines = 0
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = UIColor(red: 0.32, green: 0.12, blue: 0.55, alpha: 0.9)
        button.layer.cornerRadius = 12
        button.heightAnchor.constraint(greaterThanOrEqualToConstant: 44).isActive = true
        button.addTarget(self, action: action, for: .touchUpInside)
    }

    func setStatus(_ value: String) {
        switch value {
        case "publishing": statusLabel.text = "Sending camera stream · live status verified by CLIPT"
        case "reconnecting": statusLabel.text = "Connection interrupted · reconnecting"
        case "stopping": statusLabel.text = "Ending broadcast"
        default: statusLabel.text = "Preparing camera broadcast"
        }
    }

    @objc private func toggleMute() {
        Task {
            do {
                try await engine?.setMuted(microphone: !isMuted, systemAudio: true)
                isMuted.toggle()
                muteButton.setTitle(isMuted ? "Unmute microphone" : "Mute microphone", for: .normal)
            } catch { UIAccessibility.post(notification: .announcement, argument: "Microphone setting is unavailable") }
        }
    }
    @objc private func switchCamera() {
        Task {
            do { try await engine?.switchCamera() }
            catch { UIAccessibility.post(notification: .announcement, argument: "Camera switching is unavailable") }
        }
    }
    @objc private func endBroadcast() {
        endButton.isEnabled = false
        Task { await engine?.stop() }
    }
}
#endif
