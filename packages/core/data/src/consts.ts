// [consts.ts] 常量定义 — EmulatorJS 全局常量
// 职责：版本号、核心列表、文件扩展名映射、特殊选项名称等编译时确定的常量
// 不负责：运行时动态配置（由 core/config.js 处理）、浏览器/环境检测

export const version: string = "4.3.0-pre";

export const cores: Record<string, string[]> = {
    "atari5200": ["a5200"],
    "vb": ["beetle_vb"],
    "nds": ["melonds", "desmume", "desmume2015"],
    "arcade": ["fbneo", "fbalpha2012_cps1", "fbalpha2012_cps2", "same_cdi"],
    "nes": ["fceumm", "nestopia"],
    "gb": ["gambatte"],
    "coleco": ["gearcoleco"],
    "segaMS": ["smsplus", "genesis_plus_gx", "genesis_plus_gx_wide", "picodrive"],
    "segaMD": ["genesis_plus_gx", "genesis_plus_gx_wide", "picodrive"],
    "segaGG": ["genesis_plus_gx", "genesis_plus_gx_wide"],
    "segaCD": ["genesis_plus_gx", "genesis_plus_gx_wide", "picodrive"],
    "sega32x": ["picodrive"],
    "sega": ["genesis_plus_gx", "genesis_plus_gx_wide", "picodrive"],
    "lynx": ["handy"],
    "mame": ["mame2003_plus", "mame2003"],
    "ngp": ["mednafen_ngp"],
    "pce": ["mednafen_pce"],
    "pcfx": ["mednafen_pcfx"],
    "psx": ["pcsx_rearmed", "mednafen_psx_hw"],
    "ws": ["mednafen_wswan"],
    "gba": ["mgba"],
    "n64": ["mupen64plus_next", "parallel_n64"],
    "3do": ["opera"],
    "psp": ["ppsspp"],
    "atari7800": ["prosystem"],
    "snes": ["snes9x", "bsnes"],
    "atari2600": ["stella2014"],
    "jaguar": ["virtualjaguar"],
    "segaSaturn": ["yabause"],
    "amiga": ["puae"],
    "c64": ["vice_x64sc"],
    "c128": ["vice_x128"],
    "pet": ["vice_xpet"],
    "plus4": ["vice_xplus4"],
    "vic20": ["vice_xvic"],
    "dos": ["dosbox_pure"],
    "intv": ["freeintv"],
    "3ds": ["azahar"]
};

export const requiresThreads: string[] = ["ppsspp", "dosbox_pure", "azahar"];

export const requiresWebGL2: string[] = ["ppsspp", "azahar"];

/** Max signed 16-bit integer for RetroArch analog input values */
export const MAX_ANALOG_VALUE = 0x7fff;

/** Conversion factor from joystick angle (degrees) to Cartesian coordinate ratio (1/45) */
export const JOYSTICK_DEGREE_TO_RATIO = 1 / 45;

/** nipplejs joystick maximum expected travel distance (pixels) for normalization */
export const JOYSTICK_MAX_RADIUS = 50;

/** Gamepad axis deadzone — values below this absolute threshold are treated as zero */
export const AXIS_DEADZONE = 0.01;
