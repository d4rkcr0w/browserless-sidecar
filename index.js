import "dotenv/config";

import Axios from "axios";
import pino from "pino";
import Lightship from "lightship";

const logger = pino();

const axios = Axios.create({
  baseURL: process.env.BROWSERLESS_URL || "http://browserless:3000",
});

const lightship = Lightship.createLightship();

const bootstrap = async () => {
  while (true) {
    logger.info("running readiness probe");

    let response;

    try {
      response = await axios("/pressure");
    } catch (error) {
      logger.error(
        { err },
        "cannot get the latest pressure metrics; signaling that instance is not ready"
      );

      lightship.signalNotReady();
    }

    if (response) {
      const { pressure } = response.data;

      logger.info(
        {
          pressure,
        },
        "received new pressure report"
      );

      if (!pressure.isAvailable) {
        logger.warn(
          "pressure API indicates that instance is not ready; signaling that instance is not ready"
        );
        lightship.signalNotReady();
      } else if (
        pressure.running >=
        Number(process.env.MAX_CONCURRENT_SESSIONS || pressure.maxConcurrent)
      ) {
        logger.warn(
          "pressure API reported queue size is equal or greater than the maximum desired queue size; signaling that instance is not ready"
        );
        lightship.signalNotReady();
      } else {
        logger.info(
          "instance is ready and can handle more requests; signaling that instance is ready"
        );
        lightship.signalReady();
      }
    }

    await new Promise((resolve) =>
      setTimeout(resolve, Number(process.env.CHECK_INTERVAL || 5000))
    );
  }
};

bootstrap();
