import React, { useEffect, useState } from "react";
// import { watchBlockNumber } from "@wagmi/core";
import { useScaffoldContractRead, useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

export const Round: React.FC<{ showRoundCalculating: boolean; roundNumber: number }> = ({
  showRoundCalculating,
  roundNumber,
}) => {
  // const [isRoundClosing, setIsRoundClosing] = useState(false);

  // const { data: roundNumber } = useScaffoldContractRead({
  //   contractName: "Market",
  //   functionName: "getCurrentRoundNumber",
  // });

  // const { data: roundState } = useScaffoldContractRead({
  //   contractName: "Market",
  //   functionName: "getCurrentRoundState",
  // });

  // const closingOrCalculating = roundState === 1 || roundState === 2;

  // const { data: roundTimeRemaining } = useScaffoldContractRead({
  //   contractName: "Market",
  //   functionName: "getRoundTimeRemaining",
  // });

  // useScaffoldEventSubscriber({
  //   contractName: "Market",
  //   eventName: "RoundStart",

  //   listener: logs => {
  //     console.log("RoundOpen", logs);
  //     setIsRoundClosing(false);
  //   },
  // });

  // useScaffoldEventSubscriber({
  //   contractName: "Market",
  //   eventName: "RoundClosing",

  //   listener: logs => {
  //     console.log("RoundClosing", logs);
  //     setIsRoundClosing(true);
  //   },
  // });

  // useScaffoldEventSubscriber({
  //   contractName: "Market",
  //   eventName: "RoundCalculating",

  //   listener: logs => {
  //     console.log("RoundCalculating", logs);
  //     setIsRoundClosing(true);
  //   },
  // });

  // useScaffoldEventSubscriber({
  //   contractName: "Market",
  //   eventName: "ContestClosed",
  //   listener: logs => {
  //     console.log("RoundCalculating", logs);
  //     setIsRoundClosing(false);
  //   },
  // });

  // const roundStateToName: {
  //   [key: number]: string;
  // } = {
  //   0: "Open",
  //   1: "Closing",
  //   2: "Calculating",
  //   3: "Closed",
  // };

  return (
    <>
      <div className="mb-5">
        <h3 className="text-center text-3xl xl:text-4xl font-cubano mb-8">ROI</h3>
        {/* <div className="stats w-full bg-[#FFFFFF15] border border-[#FFFFFF88]">
          <div className="stat place-items-center">
            <div className="stat-title">Number</div>
            <div className="stat-value text-4xl">{roundNumber?.toString()} of 3</div>
          </div>

          <div className={`stat place-items-center ${closingOrCalculating && "body-glow"}`}>
            <div className="stat-title">State</div>
            <div className="stat-value text-4xl">{roundState !== undefined && roundStateToName[roundState]}</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title">Clock</div>
            <div className="stat-value">{isRoundClosing ? "0" : Number(roundTimeRemaining) || 0}</div>
          </div>
        </div> */}
      </div>
      <RoiTable />

      {showRoundCalculating && (
        <div className="bg-base-200 border border-base-200 p-5 font-cubano mt-10 text-2xl text-center rounded-xl">
          Round {roundNumber} calculating...
        </div>
      )}
    </>
  );
};

type RoundResultsData = {
  contestNumber: number;
  roundNumber: number;
  lowRiskVaultROI: number;
  mediumRiskVaultROI: number;
  highRiskVaultROI: number;
};

/**
 *
 * @notice use contestNumber to filter the results so you only get round roi for current contest
 * @notice don't forget to turn on!
 */

const RoiTable = () => {
  const [roundResults, setRoundResults] = useState<RoundResultsData[]>([]);

  const { data: currentContestNumber } = useScaffoldContractRead({
    contractName: "Market",
    functionName: "getCurrentContestNumber",
  });

  const { data: events, isLoading: isLoadingEvents } = useScaffoldEventHistory({
    contractName: "Market",
    eventName: "RoundROIResults",
    // Specify the starting block number from which to read events, this is a bigint.
    // fromBlock: 0n,
    fromBlock: 43030910n,
    // blockData: true,
    // Apply filters to the event based on parameter names and values { [parameterName]: value },
    filters: { contestNumber: currentContestNumber },
    // transactionData: true,
    // receiptData: true,
  });

  console.log("ROUND ROI events", events);

  // useScaffoldEventSubscriber({
  //   contractName: "Market",
  //   eventName: "ContestOpened",

  //   listener: logs => {
  //     logs.forEach(log => {
  //       console.log("ContestOpened", log);
  //       setRoundResults([]);
  //     });
  //   },
  // });

  useScaffoldEventSubscriber({
    contractName: "Market",
    eventName: "RoundROIResults",
    listener: logs => {
      logs.map(log => {
        const { contestNumber, roundNumber, lowRiskVaultROI, mediumRiskVaultROI, highRiskVaultROI } = log.args;
        setRoundResults(prevResults => {
          return [
            ...prevResults,
            {
              contestNumber: Number(contestNumber),
              roundNumber: Number(roundNumber),
              lowRiskVaultROI: Number(lowRiskVaultROI),
              mediumRiskVaultROI: Number(mediumRiskVaultROI),
              highRiskVaultROI: Number(highRiskVaultROI),
            },
          ];
        });
      });
    },
  });

  useEffect(() => {
    if (!roundResults?.length && !!events?.length && !isLoadingEvents) {
      const unsortedRoundResults = events.map(({ args }) => {
        return {
          contestNumber: Number(args.contestNumber),
          roundNumber: Number(args.roundNumber),
          lowRiskVaultROI: Number(args.lowRiskVaultROI),
          mediumRiskVaultROI: Number(args.mediumRiskVaultROI),
          highRiskVaultROI: Number(args.highRiskVaultROI),
        };
      });

      const sortedRoundResults = unsortedRoundResults.sort((a, b) => a.roundNumber - b.roundNumber);

      setRoundResults(sortedRoundResults);
    }
  }, [roundResults.length, events, isLoadingEvents]);

  const roiColor = (roi: number) => {
    if (roi > 0) {
      return "text-green-400";
    } else if (roi < 0) {
      return "text-red-400";
    }
  };

  const generatePlaceholderData = () => ({
    contestNumber: 0,
    roundNumber: 0,
    lowRiskVaultROI: 0,
    mediumRiskVaultROI: 0,
    highRiskVaultROI: 0,
  });

  const tableRows =
    roundResults.length >= 3
      ? roundResults
      : [...roundResults, ...Array(3 - roundResults.length).fill(generatePlaceholderData())];

  return (
    <div className="overflow-x-auto">
      <table className="table text-xl">
        <thead>
          <tr className="text-xl border-b border-white">
            <th>Round</th>
            <th>Low</th>
            <th>Med</th>
            <th>High</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((result, index) => (
            <tr key={index} className="border-b border-[#FFFFFF33]">
              <th>{index + 1}</th>
              <td className={roiColor(result.lowRiskVaultROI)}>
                {result.lowRiskVaultROI ? `${result.lowRiskVaultROI}%` : "-"}
              </td>
              <td className={roiColor(result.mediumRiskVaultROI)}>
                {result.mediumRiskVaultROI ? `${result.mediumRiskVaultROI}%` : "-"}
              </td>
              <td className={roiColor(result.highRiskVaultROI)}>
                {result.highRiskVaultROI ? `${result.highRiskVaultROI}%` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
