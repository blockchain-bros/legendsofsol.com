export enum WLStatus {
  added = "added",
  invited = "invited",
  waitlisted = "waitlisted",
  verified = "verified",
  null = "",
}

export enum MaxWL {
  default = 3,
}

export enum MaxAirdrop {
  default = 2,
}

export enum AirdropStatus {
  max = "MAXIMUM",
  std = "STANDARD",
  min = "MINIMUM",
  null = "",
}

export interface WhiteListedProps {
  handle: string;
  status: WLStatus;
  image?: string;
}

export interface WhitelistUser {
  handle: string;
  invitedBy: string;
  status: WLStatus;
  tweetSent: boolean;
  image: string | null;
}

export interface WhitelistUserStatus {
  status: WLStatus;
  invitedBy: string;
  invitesUsed: number;
  invitesLeft: number;
  invitesConfirmed: number;
  whitelistSpots: number;
  existingUsers: WhitelistUser[];
}
