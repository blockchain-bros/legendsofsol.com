import React, { useRef, useEffect, useState } from "react";
import { Box } from "@mui/material";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
}

const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  let stars: Star[] = createStars(200, dimensions.width, dimensions.height);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (context && dimensions.width && dimensions.height) {
      function updateStar(star: Star) {
        // Move star towards the viewer
        star.z -= 0.2;

        // Reset star once it passes the viewer
        if (star.z <= 0) {
          star.z = dimensions.width;
          star.x = Math.random() * dimensions.width * 2 - dimensions.width;
          star.y = Math.random() * dimensions.height * 2 - dimensions.height;
        }
      }

      function drawStar(star: Star) {
        const xCenter = dimensions.width / 2;
        const yCenter = dimensions.height / 2;
        const k = 128 / star.z;
        const px = star.x * k + xCenter;
        const py = star.y * k + yCenter;
        const size = star.size * 2;

        if (context) {
          context.beginPath();
          context.fillRect(px - size / 2, py - size / 2, size, size);
        }
      }

      function draw() {
        if (context) {
          context.fillStyle = "#01061a";
          context.fillRect(0, 0, dimensions.width, dimensions.height);
          context.fillStyle = "#ffeeb7";
        }

        stars.forEach((star) => {
          updateStar(star);
          drawStar(star);
        });

        requestAnimationFrame(draw);
      }

      draw();
    }
  }, [dimensions]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </Box>
  );
};

function createStars(count: number, width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width * 2 - width,
      y: Math.random() * height * 2 - height,
      z: Math.random() * width,
      size: Math.random() * 2,
    });
  }
  return stars;
}

export default Starfield;
