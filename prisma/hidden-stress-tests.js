function values(count, mapper) {
  return Array.from({ length: count }, (_, index) => mapper(index));
}

function line(items) {
  return `${items.join(" ")}\n`;
}

function range(count, start = 1, step = 1) {
  return values(count, (index) => start + index * step);
}

function repeated(count, value) {
  return values(count, () => value);
}

function maxContainerArea(heights) {
  let left = 0;
  let right = heights.length - 1;
  let best = 0;

  while (left < right) {
    best = Math.max(best, Math.min(heights[left], heights[right]) * (right - left));

    if (heights[left] < heights[right]) {
      left += 1;
    } else {
      right -= 1;
    }
  }

  return best;
}

function base26(index, width = 6) {
  let remaining = index;
  let word = "";

  do {
    word = String.fromCharCode(97 + (remaining % 26)) + word;
    remaining = Math.floor(remaining / 26);
  } while (remaining > 0);

  return word.padStart(width, "a");
}

function makeTest(input, expectedOutput) {
  return { input, expectedOutput };
}

function buildStressTests() {
  const twoSumN = 50_000;
  const twoSumValues = [...range(twoSumN - 2), 100_000_000, 100_000_001];

  const stockN = 100_000;
  const stockPrices = values(stockN, (index) => stockN - index);

  const insertIntervalN = 10_000;
  const insertIntervals = values(insertIntervalN, (index) => `${index * 2} ${index * 2}`).join(
    "\n",
  );

  const threeSumN = 1_500;
  const threeSumValues = range(threeSumN);

  const productN = 9_000;
  const productValues = repeated(productN, 1);

  const combinationCandidates = range(30, 501);

  const mergeN = 30_000;
  const mergeIntervals = values(mergeN, (index) => `${index} ${index + 100_000}`).join("\n");

  const majorityN = 100_000;
  const majorityValues = [...repeated(50_001, 7), ...range(49_999, 8)];

  const sortColorsN = 9_000;
  const sortedColorBlock = repeated(sortColorsN / 3, 0).concat(
    repeated(sortColorsN / 3, 1),
    repeated(sortColorsN / 3, 2),
  );

  const containsDuplicateN = 50_000;
  const uniqueValues = range(containsDuplicateN);

  const containerN = 50_000;
  const containerHeights = range(containerN);

  const gasN = 50_000;
  const gasValues = [...repeated(gasN - 1, 1), gasN];
  const costValues = [...repeated(gasN - 2, 1), 2, 1];

  const consecutiveN = 100_000;
  const consecutiveValues = values(consecutiveN, (index) => consecutiveN - index);

  const rotateN = 9_000;
  const rotateValues = [1, ...repeated(rotateN - 1, 0)];
  const rotatedValues = rotateValues.slice(1).concat(rotateValues[0]);

  const contiguousN = 100_000;
  const alternatingBits = values(contiguousN, (index) => index % 2);

  const subarrayN = 100_000;
  const zeroValues = repeated(subarrayN, 0);

  const moveZeroesN = 9_000;
  const mixedZeroes = values(moveZeroesN, (index) => (index % 2 === 0 ? 0 : 1));
  const movedZeroes = repeated(moveZeroesN / 2, 1).concat(repeated(moveZeroesN / 2, 0));

  const slidingN = 100_000;
  const slidingK = slidingN - 1;
  const slidingValues = range(slidingN);
  const slidingMaximums = range(slidingN - slidingK + 1, slidingK);

  const squaresN = 9_000;
  const squareInputs = repeated(squaresN / 3, -1).concat(
    repeated(squaresN / 3, 0),
    repeated(squaresN / 3, 1),
  );
  const squareOutputs = repeated(squaresN / 3, 0).concat(repeated((squaresN / 3) * 2, 1));

  const anagramN = 9_000;
  const anagramWords = repeated(anagramN, "a");

  const replacementString = "AB".repeat(50_000);

  const prefixN = 5_000;
  const commonPrefix = "a".repeat(199);
  const prefixWords = values(
    prefixN,
    (index) => `${commonPrefix}${String.fromCharCode(97 + (index % 26))}`,
  );

  const largestN = 10_000;
  const largestValues = values(largestN, (index) => (index % 2 === 0 ? "9" : "91"));

  const palindromeN = 5_000;
  const palindromeWords = values(palindromeN, (index) => `a${base26(index)}b`);

  const meetingRoomsN = 50_000;
  const meetingRoomIntervals = values(meetingRoomsN, (index) => `${index * 2} ${index * 2 + 1}`);

  const employeeIntervalN = 20_000;
  const employeeOneIntervals = values(
    employeeIntervalN,
    (index) => `${index * 4} ${index * 4 + 1}`,
  ).join("\n");
  const employeeTwoIntervals = values(
    employeeIntervalN,
    (index) => `${index * 4 + 1} ${index * 4 + 4}`,
  ).join("\n");

  const overlappingMeetingsN = 50_000;
  const overlappingMeetings = repeated(overlappingMeetingsN, "0 100000").join("\n");

  const closestN = 2_000;
  const closestValues = range(closestN);

  const nonOverlapN = 50_000;
  const overlappingChain = values(nonOverlapN, (index) => `${index} ${index + 2}`).join("\n");

  const palindromeStress = `${"a".repeat(50_000)}${"!".repeat(1_000)}${"A".repeat(50_000)}`;
  const anagramLeft = `${"a".repeat(50_000)}${"b".repeat(50_000)}`;
  const anagramRight = `${"b".repeat(50_000)}${"a".repeat(50_000)}`;
  const distinctAlphabet = "abcdefghijklmnopqrstuvwxyz";
  const noRepeatStress = distinctAlphabet.repeat(4_000);
  const minimumWindowSource = `${"A".repeat(50_000)}BC${"A".repeat(50_000)}`;
  const atoiStress = `${" ".repeat(10_000)}${"9".repeat(100_000)}`;
  const palindromicSubstringStress = "a".repeat(50_000);
  const anagramSearchSource = "a".repeat(100_000);
  const anagramSearchPattern = "a".repeat(50_000);
  const anagramSearchOutput = line(range(50_001, 0));
  const codecStrings = values(10_000, (index) =>
    index % 2 === 0 ? `value#${index}` : `value ${index}`,
  );
  const codecEncoded = codecStrings.map((value) => `${value.length}#${value}`).join("");

  return {
    "sum-two-numbers": [makeTest("1000000000 -1000000000\n", "0\n")],
    "two-sum": [
      makeTest(`${twoSumN} 200000001\n${line(twoSumValues)}`, `${twoSumN - 2} ${twoSumN - 1}\n`),
    ],
    "best-time-to-buy-and-sell-stock": [makeTest(`${stockN}\n${line(stockPrices)}`, "0\n")],
    "insert-interval": [
      makeTest(`${insertIntervalN}\n${insertIntervals}\n-1 20000\n`, "-1 20000\n"),
    ],
    "three-sum": [makeTest(`${threeSumN}\n${line(threeSumValues)}`, "EMPTY\n")],
    "product-of-array-except-self": [
      makeTest(`${productN}\n${line(productValues)}`, line(productValues)),
    ],
    "combination-sum": [makeTest(`30 500\n${line(combinationCandidates)}`, "EMPTY\n")],
    "merge-intervals": [makeTest(`${mergeN}\n${mergeIntervals}\n`, `0 ${mergeN - 1 + 100_000}\n`)],
    "majority-element": [makeTest(`${majorityN}\n${line(majorityValues)}`, "7\n")],
    "sort-colors": [
      makeTest(
        `${sortColorsN}\n${line(values(sortColorsN, (index) => [2, 1, 0][index % 3]))}`,
        line(sortedColorBlock),
      ),
    ],
    "contains-duplicate": [makeTest(`${containsDuplicateN}\n${line(uniqueValues)}`, "false\n")],
    "container-with-most-water": [
      makeTest(
        `${containerN}\n${line(containerHeights)}`,
        `${maxContainerArea(containerHeights)}\n`,
      ),
    ],
    "gas-station": [makeTest(`${gasN}\n${line(gasValues)}${line(costValues)}`, `${gasN - 1}\n`)],
    "longest-consecutive-sequence": [
      makeTest(`${consecutiveN}\n${line(consecutiveValues)}`, `${consecutiveN}\n`),
    ],
    "rotate-array": [
      makeTest(`${rotateN} ${rotateN - 1}\n${line(rotateValues)}`, line(rotatedValues)),
    ],
    "contiguous-array": [makeTest(`${contiguousN}\n${line(alternatingBits)}`, `${contiguousN}\n`)],
    "subarray-sum-equals-k": [
      makeTest(`${subarrayN} 0\n${line(zeroValues)}`, `${(subarrayN * (subarrayN + 1)) / 2}\n`),
    ],
    "move-zeroes": [makeTest(`${moveZeroesN}\n${line(mixedZeroes)}`, line(movedZeroes))],
    "sliding-window-maximum": [
      makeTest(`${slidingN} ${slidingK}\n${line(slidingValues)}`, line(slidingMaximums)),
    ],
    "squares-of-a-sorted-array": [
      makeTest(`${squaresN}\n${line(squareInputs)}`, line(squareOutputs)),
    ],
    "meeting-rooms": [makeTest(`${meetingRoomsN}\n${meetingRoomIntervals.join("\n")}\n`, "true\n")],
    "employee-free-time": [
      makeTest(
        `2\n${employeeIntervalN}\n${employeeOneIntervals}\n${employeeIntervalN}\n${employeeTwoIntervals}\n`,
        "EMPTY\n",
      ),
    ],
    "meeting-rooms-ii": [
      makeTest(`${overlappingMeetingsN}\n${overlappingMeetings}\n`, `${overlappingMeetingsN}\n`),
    ],
    "three-sum-closest": [makeTest(`${closestN} -10\n${line(closestValues)}`, "6\n")],
    "non-overlapping-intervals": [
      makeTest(`${nonOverlapN}\n${overlappingChain}\n`, `${nonOverlapN / 2}\n`),
    ],
    "valid-palindrome": [makeTest(`${palindromeStress}\n`, "true\n")],
    "valid-anagram": [makeTest(`${anagramLeft}\n${anagramRight}\n`, "true\n")],
    "longest-substring-without-repeating-characters": [makeTest(`${noRepeatStress}\n`, "26\n")],
    "longest-palindrome": [makeTest(`${"ab".repeat(50_000)}\n`, "100000\n")],
    "minimum-window-substring": [makeTest(`${minimumWindowSource}\nABC\n`, "ABC\n")],
    "string-to-integer-atoi": [makeTest(`${atoiStress}\n`, "2147483647\n")],
    "longest-palindromic-substring": [
      makeTest(`${palindromicSubstringStress}\n`, `${palindromicSubstringStress}\n`),
    ],
    "find-all-anagrams-in-a-string": [
      makeTest(`${anagramSearchSource}\n${anagramSearchPattern}\n`, anagramSearchOutput),
    ],
    "group-anagrams": [
      makeTest(`${anagramN}\n${anagramWords.join("\n")}\n`, `${anagramWords.join(" ")}\n`),
    ],
    "longest-repeating-character-replacement": [makeTest(`${replacementString}\n0\n`, "1\n")],
    "longest-common-prefix": [
      makeTest(`${prefixN}\n${prefixWords.join("\n")}\n`, `${commonPrefix}\n`),
    ],
    "largest-number": [
      makeTest(
        `${largestN}\n${line(largestValues)}`,
        `${"9".repeat(largestN / 2)}${"91".repeat(largestN / 2)}\n`,
      ),
    ],
    "encode-and-decode-strings": [
      makeTest(
        `${codecStrings.length}\n${codecStrings.join("\n")}\n`,
        `${codecEncoded}\n${codecStrings.join("\n")}\n`,
      ),
    ],
    "palindrome-pairs": [makeTest(`${palindromeN}\n${palindromeWords.join("\n")}\n`, "EMPTY\n")],
  };
}

module.exports = { buildStressTests };
