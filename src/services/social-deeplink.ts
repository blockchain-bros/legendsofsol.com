import { getAndroidDeepLink, getIOSDeepLink } from "url-to-deep-link";

enum OS {
  ANDROID = "Android",
  IOS = "iOS",
  WEB = "web",
}

/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * @returns {String}
 */
const getMobileOperatingSystem = () => {
  if (/Android/i.test(navigator.userAgent)) {
    return OS.ANDROID;
  }
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return OS.IOS;
  }
  return OS.WEB;
};

export const genDeepLink = (url: string) => {
  const OpSys = getMobileOperatingSystem();

  console.log("OpSys", OpSys, getAndroidDeepLink(url), getIOSDeepLink(url));
  

  switch (OpSys) {
    case OS.ANDROID:
      return getAndroidDeepLink(url);
    case OS.IOS:
      return getIOSDeepLink(url);
    default:
      return url;
  }
};
