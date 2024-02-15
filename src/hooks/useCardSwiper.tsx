import { useEffect, useRef, useState } from "react";
import {
  CardData,
  CardEnterEvent,
  CardEvents,
  CardId,
  SwipeAction,
  SwipeDirection,
  SwipeOperation,
} from "../types/swiper";
import { Swiper } from "../utils/swiper";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  collectionsPageState,
  collectionsState,
  highScoreState,
} from "../state";
import { debounce, sortBy, unionBy } from "lodash";
import { ApiPagination, LowRecordCount } from "../types/api";

export const useCardSwiper = ({ onDismiss, onFinish, onEnter }: CardEvents) => {
  const swiperElements = useRef<Swiper[]>([]);
  const [data, setData] = useRecoilState(collectionsState);
  const [page, setPage] = useRecoilState(collectionsPageState);
  const setHighScore = useSetRecoilState(highScoreState);
  const [isFinish, setIsFinish] = useState(false);
  const [lastPage, setLastPage] = useState(false);

  // useEffect(() => {
  //   console.log("data updated", page, data.length, data);
  // }, [data]);

  useEffect(() => {
    localStorage.setItem("mintrPagination", String(page));
  }, [page]);

  useEffect(() => {
    (async () => {
      if (data.length > 0) {
        setIsFinish(false);
      }
      if (!lastPage && !isFinish && data.length === LowRecordCount.default) {
        const fetchNFTs = debounce(async () => {
          const res = await fetch(
            `/api/mintder?page=${page}&limit=${ApiPagination.limit}`
          );
          const resData = await res.json();
          if (resData.nfts.length < ApiPagination.limit) {
            setLastPage(true);
          }
          const sortedData = resData.nfts.sort((a: any, b: any) => a.id - b.id);
          setData((prev) => unionBy(sortedData, prev, "id"));
          setPage((prev: string | number) => Number(prev) + 1);
        }, 300);
        await fetchNFTs();
      }
    })();
  }, [data]);

  const handleNewCardSwiper = async (
    ref: HTMLDivElement | null,
    id: CardId
  ) => {
    if (ref) {
      // Check if id already exists
      const existingSwiper = swiperElements.current.find(
        (swiper) => swiper.id === id
      );
      // The chunk order of the array is really important
      if (!existingSwiper) {
        const currentSwiper = new Swiper({
          element: ref,
          id,
          onDismiss: handleDismiss,
        });
        swiperElements.current = sortBy(
          [currentSwiper, ...swiperElements.current],
          "id"
        );
      }
    }
  };

  const handleEnter: CardEnterEvent = (element, id) => {
    onEnter && onEnter(element, id);
  };

  const handleDismiss = (
    element: HTMLDivElement,
    id: CardId,
    action: SwipeAction,
    operation: SwipeOperation
  ) => {
    onDismiss && onDismiss(element, id, action, operation);
    swiperElements.current = swiperElements.current.filter(
      (swiper) => swiper.id !== id
    );
    setTimeout(() => {
      setData((prev) => prev.filter((item: CardData) => item.id !== id));
    }, 200);
    setHighScore((prev) => prev + 1);
  };

  const handleClickEvents = (direction: SwipeDirection) => {
    if (data.length > 0) {
      const swiper = swiperElements.current[data.length - 1];
      swiper?.dismissById(direction);
    }
  };

  useEffect(() => {
    if (!data.length && typeof onFinish === "function") {
      setPage(1);
      setIsFinish(true);
      onFinish(SwipeAction.FINISHED);
    }
  }, [data]);

  return {
    isFinish,
    swiperElements,
    handleEnter,
    handleClickEvents,
    handleNewCardSwiper,
  };
};
