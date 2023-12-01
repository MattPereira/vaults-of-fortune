import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";

const steps = [
  {
    number: 1,
    text: (
      <>
        Enter contest to be airdropped 10,000 <span className="text-yellow-400">GODL</span> tokens
      </>
    ),
  },
  {
    number: 2,
    text: (
      <>
        Deposit your <span className="text-yellow-400">GODL</span> into the vaults according to your risk tolerance
      </>
    ),
  },
  {
    number: 3,
    text: <>Wait for Chainlink VRF to generate the random numbers that determine return on investment for each vault</>,
  },
  {
    number: 4,
    text: (
      <>
        Re-allocate your <span className="text-yellow-400">GODL</span> each round based on game theory of where other
        players are allocated
      </>
    ),
  },
  {
    number: 5,
    text: (
      <>
        At the end of the third round, the player with the most <span className="text-yellow-400">GODL</span> is the
        champion
      </>
    ),
  },
];

/** Homepage explains how the game works and offers enter contest button
 */

const Home: NextPage = () => {
  return (
    <>
      <MetaHeader />
      <div className="bg-base-300 grow px-5 md:px-10 xl:px-20">
        <h1 className="font-cubano text-4xl md:text-6xl xl:text-6xl text-center my-14 lg:my-20"> Vaults of Fortune</h1>

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 items-center">
          <div className="flex justify-center">
            <Image src="/banner.png" width="1000" height="1000" alt="vaults of fortune banner" />
          </div>
          <div className="">
            <h2 className="font-cubano text-4xl text-center">How to Play</h2>
            <div className="rounded-xl py-10 pl-10 lg:pl-20 pr-5 lg:pr-10">
              {steps.map(step => (
                <div key={step.number} className="text-2xl flex gap-4 mb-5 items-center">
                  <div
                    style={{ minWidth: "40px" }}
                    className="border-2 font-bold border-white w-10 h-10 flex items-center justify-center rounded-full"
                  >
                    {step.number}
                  </div>
                  <div>{step.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center my-10 lg:my-20">
          <Link
            className="bg-[#4e389c51] hover:bg-[#4e389c69] hover:font-semibold border-2 border-[#6c4ed9ff] px-14 rounded-full text-3xl py-8 capitalize flex items-center gap-5"
            href="/contest"
          >
            Explore Vaults
            <ArrowRightIcon className="w-7 h-7" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;
