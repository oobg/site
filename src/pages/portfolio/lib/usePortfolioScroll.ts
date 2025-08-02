import { useEffect, useRef } from "react";

export const usePortfolioScroll = (
  currentSection: number,
  setCurrentSection: (section: number) => void,
  isScrolling: boolean,
  setIsScrolling: (scrolling: boolean) => void,
) => {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let isTouching = false;

    const handleWheel = (e: WheelEvent) => {
      const currentSectionElement = document.querySelectorAll("section")[currentSection];
      if (!currentSectionElement) return;

      const sectionRect = currentSectionElement.getBoundingClientRect();
      const sectionHeight = currentSectionElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const isContentOverflow = sectionHeight > viewportHeight;

      if (isContentOverflow) {
        // 내용이 화면보다 길 때는 일반 스크롤 허용
        const isAtTop = sectionRect.top >= 0;
        const isAtBottom = sectionRect.bottom <= viewportHeight;

        if (
          (e.deltaY > 0 && isAtBottom && currentSection < 2) ||
          (e.deltaY < 0 && isAtTop && currentSection > 0)
        ) {
          // 페이지 끝에 도달했을 때만 페이지 전환
          e.preventDefault();

          if (isScrolling) return;
          setIsScrolling(true);

          let nextSection = currentSection;
          if (e.deltaY > 0) {
            nextSection = currentSection + 1;
          } else {
            nextSection = currentSection - 1;
          }

          if (nextSection !== currentSection) {
            setCurrentSection(nextSection);

            const sections = document.querySelectorAll("section");
            if (sections[nextSection]) {
              sections[nextSection].scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }

          setTimeout(() => {
            setIsScrolling(false);
          }, 800);
        }
      } else {
        // 내용이 화면보다 짧을 때는 즉시 페이지 전환
        e.preventDefault();

        if (isScrolling) return;
        setIsScrolling(true);

        const delta = e.deltaY;
        let nextSection = currentSection;

        if (delta > 0 && currentSection < 2) {
          nextSection = currentSection + 1;
        } else if (delta < 0 && currentSection > 0) {
          nextSection = currentSection - 1;
        }

        if (nextSection !== currentSection) {
          setCurrentSection(nextSection);

          const sections = document.querySelectorAll("section");
          if (sections[nextSection]) {
            sections[nextSection].scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }

        setTimeout(() => {
          setIsScrolling(false);
        }, 800);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isTouching = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching || isScrolling) return;

      currentY = e.touches[0].clientY;
    };

    const handleTouchEnd = (_e: TouchEvent) => {
      if (!isTouching || isScrolling) return;

      isTouching = false;

      const currentSectionElement = document.querySelectorAll("section")[currentSection];
      if (!currentSectionElement) return;

      const sectionRect = currentSectionElement.getBoundingClientRect();
      const sectionHeight = currentSectionElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const isContentOverflow = sectionHeight > viewportHeight;

      if (isContentOverflow) {
        // 내용이 화면보다 길 때는 페이지 끝에서만 전환
        const isAtTop = sectionRect.top >= 0;
        const isAtBottom = sectionRect.bottom <= viewportHeight;

        const deltaY = startY - currentY;
        const minSwipeDistance = 50;

        if (Math.abs(deltaY) > minSwipeDistance) {
          if (
            (deltaY > 0 && isAtBottom && currentSection < 2) ||
            (deltaY < 0 && isAtTop && currentSection > 0)
          ) {
            setIsScrolling(true);

            let nextSection = currentSection;
            if (deltaY > 0) {
              nextSection = currentSection + 1;
            } else {
              nextSection = currentSection - 1;
            }

            if (nextSection !== currentSection) {
              setCurrentSection(nextSection);

              const sections = document.querySelectorAll("section");
              if (sections[nextSection]) {
                sections[nextSection].scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }

            setTimeout(() => {
              setIsScrolling(false);
            }, 800);
          }
        }
      } else {
        // 내용이 화면보다 짧을 때는 즉시 전환
        setIsScrolling(true);

        const deltaY = startY - currentY;
        const minSwipeDistance = 50;

        if (Math.abs(deltaY) > minSwipeDistance) {
          let nextSection = currentSection;

          if (deltaY > 0 && currentSection < 2) {
            nextSection = currentSection + 1;
          } else if (deltaY < 0 && currentSection > 0) {
            nextSection = currentSection - 1;
          }

          if (nextSection !== currentSection) {
            setCurrentSection(nextSection);

            const sections = document.querySelectorAll("section");
            if (sections[nextSection]) {
              sections[nextSection].scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }
        }

        setTimeout(() => {
          setIsScrolling(false);
        }, 800);
      }
    };

    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener("wheel", handleWheel, { passive: false });
      mainElement.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      mainElement.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      mainElement.addEventListener("touchend", handleTouchEnd, {
        passive: false,
      });
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener("wheel", handleWheel);
        mainElement.removeEventListener("touchstart", handleTouchStart);
        mainElement.removeEventListener("touchmove", handleTouchMove);
        mainElement.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [currentSection, isScrolling, setCurrentSection, setIsScrolling]);

  return mainRef;
};
