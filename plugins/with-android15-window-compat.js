const fs = require("fs");
const path = require("path");
const {
  AndroidConfig,
  withAndroidStyles,
  withFinalizedMod,
  withGradleProperties,
  withMainActivity,
} = require("@expo/config-plugins");

const WINDOW_STYLE_NAMES_TO_REMOVE = [
  "android:statusBarColor",
  "android:navigationBarColor",
  "android:windowOptOutEdgeToEdgeEnforcement",
];

const EDGE_TO_EDGE_GRADLE_PROPERTIES = [
  "edgeToEdgeEnabled",
  "expo.edgeToEdgeEnabled",
];

function updateGradleProperty(properties, key, value) {
  const property = properties.find(
    (item) => item.type === "property" && item.key === key,
  );

  if (property) {
    property.value = value;
    return properties;
  }

  properties.push({ type: "property", key, value });
  return properties;
}

function removeDeprecatedBarColorStyles(stylesXml) {
  const appTheme = AndroidConfig.Styles.getAppThemeGroup();

  return WINDOW_STYLE_NAMES_TO_REMOVE.reduce(
    (xml, name) =>
      AndroidConfig.Styles.removeStylesItem({
        xml,
        parent: appTheme,
        name,
      }),
    stylesXml,
  );
}

function removeDeprecatedBarColorLines(stylesXml) {
  return WINDOW_STYLE_NAMES_TO_REMOVE.reduce(
    (xml, name) =>
      xml.replace(
        new RegExp(`\\s*<item name="${name}">.*?<\\/item>\\r?\\n?`, "g"),
        "",
      ),
    stylesXml,
  );
}

function patchMainActivity(mainActivity) {
  let next = mainActivity;

  if (!next.includes("import android.view.WindowManager")) {
    next = next.replace(
      "import android.os.Bundle\n",
      "import android.os.Bundle\nimport android.view.WindowManager\n",
    );
  }

  if (next.includes("LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS")) {
    return next;
  }

  return next.replace(
    "    setTheme(R.style.AppTheme);\n    super.onCreate(null)",
    `    setTheme(R.style.AppTheme);
    if (Build.VERSION.SDK_INT >= 35) {
      window.attributes = window.attributes.apply {
        layoutInDisplayCutoutMode =
          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
      }
    }
    super.onCreate(null)`,
  );
}

function writeFileIfChanged(filePath, contents) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const previousContents = fs.readFileSync(filePath, "utf8");
  if (previousContents !== contents) {
    fs.writeFileSync(filePath, contents);
  }
}

function withAndroid15WindowCompat(config) {
  config = withGradleProperties(config, (modConfig) => {
    modConfig.modResults = EDGE_TO_EDGE_GRADLE_PROPERTIES.reduce(
      (properties, key) => updateGradleProperty(properties, key, "false"),
      modConfig.modResults,
    );
    return modConfig;
  });

  config = withAndroidStyles(config, (modConfig) => {
    modConfig.modResults = removeDeprecatedBarColorStyles(
      modConfig.modResults,
    );
    return modConfig;
  });

  config = withMainActivity(config, (modConfig) => {
    modConfig.modResults.contents = patchMainActivity(
      modConfig.modResults.contents,
    );
    return modConfig;
  });

  return withFinalizedMod(config, [
    "android",
    async (modConfig) => {
      const androidRoot = modConfig.modRequest.platformProjectRoot;
      const stylesPath = path.join(
        androidRoot,
        "app",
        "src",
        "main",
        "res",
        "values",
        "styles.xml",
      );
      const mainActivityPath = path.join(
        androidRoot,
        "app",
        "src",
        "main",
        "java",
        "com",
        "quicksign",
        "app",
        "MainActivity.kt",
      );

      if (fs.existsSync(stylesPath)) {
        writeFileIfChanged(
          stylesPath,
          removeDeprecatedBarColorLines(fs.readFileSync(stylesPath, "utf8")),
        );
      }

      if (fs.existsSync(mainActivityPath)) {
        writeFileIfChanged(
          mainActivityPath,
          patchMainActivity(fs.readFileSync(mainActivityPath, "utf8")),
        );
      }

      return modConfig;
    },
  ]);
}

module.exports = withAndroid15WindowCompat;
