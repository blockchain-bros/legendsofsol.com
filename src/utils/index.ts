import dayjs from "dayjs";
import { AirdropStatus, MaxAirdrop, MaxWL, WLStatus } from "../types/whiteList";

export interface DiscordTokens {
  token_type?: string;
  access_token: string;
  expires_in?: number;
  scope?: string;
  state: string;
}

export const twitterHandleRegex = /^[a-zA-Z0-9_]{1,15}$/;

export const stripNonTwitterChars = (str: string) => {
  return str.replace(/[^a-zA-Z0-9_]/g, "");
};

export const splitURLString = (str: string): DiscordTokens | null => {
  if (!str.includes("#")) return null;
  const params = str
    .split("#")[1]
    .split("&")
    .reduce((acc, curr) => {
      const [key, value] = curr.split("=");
      acc[key] = value;
      return acc;
    }, {} as any);
  return {
    token_type: params.token_type,
    access_token: params.access_token,
    expires_in: Number(params.expires_in),
    scope: params.scope.replace(/\+/g, " "),
    state: params.state,
  };
};

export const handleSignOut = async (
  setDiscordVerified: (
    valOrUpdater: boolean | ((currVal: boolean) => boolean)
  ) => void,
  disconnect: () => Promise<void>,
  signOut: any,
  discordId: string,
  setPageLoading: (
    valOrUpdater: boolean | ((currVal: boolean) => boolean)
  ) => void
) => {
  setPageLoading(true);
  await fetch("/api/discord/clear", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ providerAccountId: discordId }),
  });
  setDiscordVerified(false);
  await disconnect();
  localStorage.clear();
  await signOut();
  setPageLoading(false);
};

export const blankAdd = { handle: "", status: WLStatus.null };

export const needsBlank = (InvitedUsedLength: number) => {
  return InvitedUsedLength < MaxWL.default ? [blankAdd] : [];
};

export const getAllocationStatus = (invitesConfirmed: number | undefined) => {
  if (invitesConfirmed === undefined) {
    return AirdropStatus.null;
  } else if (invitesConfirmed >= MaxAirdrop.default) {
    return AirdropStatus.max;
  } else if (invitesConfirmed === 1) {
    return AirdropStatus.std;
  } else {
    return AirdropStatus.min;
  }
};

export const cartoonPointer = (): string => {
  return `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAzElEQVRYR+2X0Q6AIAhF5f8/2jYXZkwEjNSVvVUjDpcrGgT7FUkI2D9xRfQETwNIiWO85wfINfQUEyxBG2ArsLwC0jioGt5zFcwF4OYDPi/mBYKm4t0U8ATgRm3ThFoAqkhNgWkA0jJLvaOVSs7j3qMnSgXWBMiWPXe94QqMBMBc1VZIvaTu5u5pQewq0EqNZvIEMCmxAawK0DNkay9QmfFNAJUXfgGgUkLaE7j/h8fnASkxHTz0DGIBMCnBeeM7AArpUd3mz2x3C7wADglA8BcWMZhZAAAAAElFTkSuQmCC") 14 0, pointer`;
};

export function isDate30DaysOld(dateString: string | null) {
  const date = dayjs(dateString);
  const now = dayjs();
  const diffInDays = now.diff(date, "day");
  return diffInDays > 30;
}

export function formatScore(score: number): string {
  if (score < 1000) {
    return score.toString();
  } else if (score < 1000000) {
    return (score / 1000).toFixed(score % 1000 === 0 ? 0 : 1) + "K";
  } else {
    return (score / 1000000).toFixed(score % 1000000 === 0 ? 0 : 1) + "M";
  }
}

export function getLocalStorageValue(key: string, defaultValue: any) {
  if (typeof window !== "undefined") {
    return Number(window.localStorage.getItem(key)) || defaultValue;
  }
  return defaultValue;
}

export function determineRank(rank: number): number {
  if (rank >= 1 && rank <= 100) {
    return 694200;
  } else if (rank > 100 && rank <= 500) {
    return 347100;
  } else if (rank > 500 && rank <= 1000) {
    return 208260;
  } else if (rank > 1000 && rank <= 10001) {
    return 71489;
  } else {
    return 0;
  }
}
