import { mapValues } from "lodash";
import prisma from "../../lib/prisma";
import { Connection } from "@solana/web3.js";

const generateXTXIDString = (length: number): string => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const extractXHeaders = (
  fetchString: string
): { [key: string]: string } => {
  const singleLineFetchString = fetchString.replace(/\s+/g, " ");
  const headersStart =
    singleLineFetchString.indexOf('{ "headers": {') + '{ "headers": {'.length;
  const headersEnd = singleLineFetchString.indexOf("},", headersStart);
  const headersString = singleLineFetchString
    .substring(headersStart, headersEnd)
    .trim();
  const headersLines = headersString.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  const headers: { [key: string]: string } = {};

  headersLines.forEach((line) => {
    const index = line.indexOf(":");
    if (index > -1) {
      let key = line.substring(0, index).trim().replace(/['",]/g, "");
      let value = line
        .substring(index + 1)
        .trim()
        .replace(/['",]/g, "");
      if (key === "x-client-transaction-id") {
        value = generateXTXIDString(value.length);
      }
      if (key.length > 0 && value.length > 0) {
        headers[key] = value;
      }
    }
  });

  return headers;
};

export const extractFetchUrl = (fetchString: string): string => {
  const urlMatch = fetchString.match(/fetch\("([^"]*)"/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  throw new Error("No URL found in fetch string");
};

export const createNewXFetch = async (user: string): Promise<Response> => {
  const getFetchString = await prisma.fetchString.findFirst({
    orderBy: {
      id: "desc",
    },
  });
  const fetchString = getFetchString?.fetchString;
  if (!fetchString) {
    throw new Error("No fetch string found");
  }
  const headers = extractXHeaders(fetchString);
  let fetchUrl = extractFetchUrl(fetchString);
  fetchUrl = fetchUrl.replace(
    /%22screen_name%22%3A%22[^%]*%22/,
    `%22screen_name%22%3A%22${user}%22`
  );

  const response = await fetch(fetchUrl, {
    headers: headers,
    referrer: "https://twitter.com/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  });

  const jsonResponse = await response?.json();
  let result = null;

  if (jsonResponse && jsonResponse.data && jsonResponse.data.user) {
    result = jsonResponse.data.user.result;
  }

  return result;
};

export const getCluster = () => {
  if (process.env.NEXT_SOLANA_NETWORK!.includes("devnet")) {
    return "devnet";
  } else {
    return "mainnet-beta";
  }
};

export const serializedBigIntValues = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(serializedBigIntValues);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializedBigIntValues(value)])
    );
  } else if (typeof obj === 'bigint') {
    return parseFloat((Number(obj) / 1e9).toFixed(2));
  } else if (typeof obj === 'number') {
    return parseFloat(obj.toFixed(2));
  }
  return obj;
};

export function sanitizeStringForDb(inputString: string): string {
  // List of characters to be removed or replaced
  const unsafeChars = /['"\\%_;]/g;
  // Replace unsafe characters with an empty string
  return inputString.replace(unsafeChars, '');
}

export async function checkTxLEGEND(tx: string) {
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_NETWORK!,
    "confirmed"
  );
  const getTx = await connection.getTransaction(
    tx,
    {
      maxSupportedTransactionVersion: 0,
    },
  );
  if (!getTx || !getTx.meta || !getTx.meta.preTokenBalances || !getTx.meta.postTokenBalances) {
    throw new Error("Transaction or metadata not found");
  }
  console.log("getTx", getTx);
  const mint = getTx.meta.preTokenBalances[0].mint;
  //paid for with LEGEND
  if (mint === process.env.NEXT_PUBLIC_LEGEND_TOKEN!) {
    const decimals = getTx.meta.preTokenBalances[0].uiTokenAmount.decimals;
    let transferAmount =
      BigInt(getTx.meta.postTokenBalances[0]?.uiTokenAmount.amount || '0') -
      BigInt(getTx.meta.preTokenBalances[0]?.uiTokenAmount.amount || '0');
    let legend = transferAmount / BigInt(Math.pow(10, decimals));

    return {
      mint,
      legend
    }
  }
  throw new Error("Wrong token (not LEGEND or USDC) (got " + mint + ")");
}