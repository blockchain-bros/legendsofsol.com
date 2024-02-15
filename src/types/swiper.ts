export interface SwiperProps extends CardEvents {
  id: CardId;
  element: HTMLDivElement;
}

export interface CardSwiperProps extends CardEvents {
  data: CardData[];
  likeButton?: React.JSX.Element;
  dislikeButton?: React.JSX.Element;
  superlikeButton?: React.JSX.Element;
  withActionButtons?: boolean;
  emptyState?: React.JSX.Element;
  withRibbons?: boolean;
  likeRibbonText?: string;
  dislikeRibbonText?: string;
  ribbonColors?: CardRibbonColors;
}

export interface CardEvents {
  onFinish?: (status: SwipeAction.FINISHED) => void;
  onDismiss?: CardEvent;
  onEnter?: CardEnterEvent;
}

export interface CardData {
  id: number;
  cdnImg: string;
  collectionKey?: CardId;
  collectionId: number;
  description: string;
  name: string;
  nftAddress: number;
  src: string;
  symbol: string;
  url: string;
  Collection?: Array<Collection>;
}

interface Collection {
  id: number;
  collectionKey: string;
  img: string;
  cdnImg: string;
  mime: string;
  description: string;
  name: string;
  symbol?: string;
  url?: string;
}

interface HelloMoonCollection {
  id: number;
  collectionName: string;
  helloMoonCollectionId: string;
  floorPrice?: number | null;
  volume?: number | null;
  averageWashScore?: number | null;
  slug?: string | null;
  supply?: number | null;
  currentOwnerCount?: number | null;
  ownersAvgUsdcHoldings?: number | null;
  avgPriceSol?: number | null;
  collectionId: number;
}

export type CardId = string | number;
export type CardEnterEvent = (element: HTMLDivElement, id: CardId) => void;
export type CardEvent = (
  element: HTMLDivElement,
  id: CardId,
  action: SwipeAction,
  operation: SwipeOperation
) => void;
export interface CardRibbonColors {
  bgLike?: string;
  bgDislike?: string;
  textColor?: string;
}
export enum SwipeDirection {
  LEFT = -1,
  RIGHT = 1,
}

export enum SwipeAction {
  LIKE = "like",
  DISLIKE = "dislike",
  FINISHED = "finished",
}

export enum SwipeOperation {
  SWIPE = "swipe",
  CLICK = "click",
}
