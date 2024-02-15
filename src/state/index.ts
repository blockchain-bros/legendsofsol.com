import { atom } from "recoil";
import { WhiteListedProps, WhitelistUserStatus } from "../types/whiteList";
import { CardData } from "../types/swiper";
import { getLocalStorageValue } from "../utils";

interface DiscordAccountState {
  handle: string;
  discriminator: string;
}

export const discordIdState = atom({
  key: "DiscordID",
  default: "",
});

export const discordVerifiedState = atom({
  key: "DiscordVerified",
  default: false,
});

export const discordAccountState = atom({
  key: "DiscordAccount",
  default: null as null | DiscordAccountState,
});

export const whitelistUserState = atom({
  key: "WhitelistStatus",
  default: null as null | WhitelistUserStatus,
});

export const pageLoadingState = atom({
  key: "PageLoading",
  default: false,
});

export const invitedState = atom<WhiteListedProps[]>({
  key: "invitedState",
  default: [],
});

export const collectionsState = atom<CardData[]>({
  key: "collectionsState",
  default: [],
});

export const collectionsPageState = atom({
  key: "PaginationState",
  default: getLocalStorageValue("mintrPagination", 2),
});

export const highScoreState = atom({
  key: "HighScoreState",
  default: 0,
});