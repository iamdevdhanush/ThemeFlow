// src/themes/presets.ts
var e = [
	{
		id: "cosmic-void",
		name: "Cosmic Void",
		description: "Infinite deep space nebula with stellar purple and indigo hues.",
		filename: "galaxy.jpg",
		thumbnail: "thumbnails/galaxy.webp",
		accentColor: "#a78bfa",
		defaultMode: "dark",
		defaultOverlay: .72,
		defaultBlur: 0,
		tags: [
			"Sci-Fi",
			"Space",
			"Dark"
		]
	},
	{
		id: "neo-tokyo",
		name: "Neo Tokyo Dusk",
		description: "Atmospheric rainy alleyway glowing with tranquil evening lanterns.",
		filename: "japan_street.avif",
		thumbnail: "thumbnails/japan_street.webp",
		accentColor: "#f472b6",
		defaultMode: "glass",
		defaultOverlay: .68,
		defaultBlur: 0,
		tags: [
			"Anime",
			"Rain",
			"Atmospheric"
		]
	},
	{
		id: "midnight-focus",
		name: "Midnight Focus",
		description: "Moody late-night coding session under soft cinematic lamplight.",
		filename: "boy_focus.jpg",
		thumbnail: "thumbnails/boy_focus.webp",
		accentColor: "#60a5fa",
		defaultMode: "dark",
		defaultOverlay: .7,
		defaultBlur: 0,
		tags: [
			"Focus",
			"Cozy",
			"Night"
		]
	},
	{
		id: "cyber-workstation",
		name: "Cyber Workstation",
		description: "Modern multi-monitor developer setup with calm ambient glow.",
		filename: "girl_desktop.jpg",
		thumbnail: "thumbnails/girl_desktop.webp",
		accentColor: "#c084fc",
		defaultMode: "dark",
		defaultOverlay: .72,
		defaultBlur: 0,
		tags: [
			"Desk",
			"Aesthetic",
			"Purple"
		]
	},
	{
		id: "zen-workspace",
		name: "Zen Workspace",
		description: "Clean minimalist desk with warm afternoon sunlight and foliage.",
		filename: "laptop_desk.jpg",
		thumbnail: "thumbnails/laptop_desk.webp",
		accentColor: "#34d399",
		defaultMode: "glass",
		defaultOverlay: .68,
		defaultBlur: 0,
		tags: [
			"Minimal",
			"Green",
			"Clean"
		]
	},
	{
		id: "golden-dusk",
		name: "Golden Dusk",
		description: "Breathtaking sunset casting warm amber gradients across the horizon.",
		filename: "sunset.avif",
		thumbnail: "thumbnails/sunset.webp",
		accentColor: "#fbbf24",
		defaultMode: "dark",
		defaultOverlay: .68,
		defaultBlur: 0,
		tags: [
			"Sunset",
			"Warm",
			"Sky"
		]
	},
	{
		id: "velvet-horizon",
		name: "Velvet Horizon",
		description: "Dreamy twilight skyline with gentle pastel clouds and quiet evening.",
		filename: "sikera_sunset.jpg",
		thumbnail: "thumbnails/sikera_sunset.webp",
		accentColor: "#f87171",
		defaultMode: "dark",
		defaultOverlay: .7,
		defaultBlur: 0,
		tags: [
			"Twilight",
			"Sunset",
			"Clouds"
		]
	},
	{
		id: "mystic-hallow",
		name: "Mystic Hallow",
		description: "Enchanting nocturnal forest illuminated by warm lantern glow.",
		filename: "halloween.jpg",
		thumbnail: "thumbnails/halloween.webp",
		accentColor: "#fb923c",
		defaultMode: "dark",
		defaultOverlay: .74,
		defaultBlur: 0,
		tags: [
			"Fantasy",
			"Warm",
			"Nocturnal"
		]
	}
];
function t(e) {
	return {
		id: e.id,
		name: e.name,
		description: e.description,
		imagePath: `IMAGES/${e.filename}`,
		thumbnailPath: e.thumbnail,
		accentColor: e.accentColor,
		mode: e.defaultMode,
		overlayOpacity: e.defaultOverlay,
		blur: e.defaultBlur,
		brightness: 100,
		contrast: 100,
		cardGlassOpacity: .78,
		fontFamily: "JetBrains Mono",
		effect: "none",
		soundEnabled: !1,
		soundVolume: .7,
		confettiEnabled: !0
	};
}
var n = t(e[0]), r = {
	enabled: !0,
	activeThemeId: e[0].id,
	customThemes: [],
	currentConfig: n,
	quickSwitchVisible: !0
}, i = "themeflow_user_settings_v1";
chrome.runtime.onInstalled.addListener(async (e) => {
	if (e.reason === "install") {
		let e = await chrome.storage.local.get(i);
		e && e[i] || await chrome.storage.local.set({ [i]: r });
	}
}), chrome.runtime.onMessage.addListener((e, t, n) => (e.action === "open_studio" && (chrome.tabs.create({ url: chrome.runtime.getURL("studio.html") }), n({ status: "ok" })), !0));
