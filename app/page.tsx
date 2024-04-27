"use client";
import { LoaderIcon, SparklesIcon, CopyIcon, EraseIcon } from "@/app/icons";
import { useCompletion } from "ai/react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { diffWords } from "diff";
import debounce from "lodash/debounce";
import { CSSTransition, TransitionGroup } from "react-transition-group";

const API_KEY_STORAGE_KEY = "groq_api_key";
const WORD_COUNT_LIMIT = 5000;

export default function Home() {
	const [text, setText] = useState("");
	const [diff, setDiff] = useState("");
	const [wordDiff, setWordDiff] = useState("");
	const [userInput, setUserInput] = useState("");
	const [apiKey, setApiKey] = useState("");
	const [isInputValid, setIsInputValid] = useState(true);

	useEffect(() => {
		const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
		if (storedApiKey) {
			setApiKey(storedApiKey);
		}
	}, []);

	const {
		completion,
		input,
		isLoading,
		handleInputChange,
		handleSubmit,
		setInput,
	} = useCompletion({
		body: { text: userInput, apiKey: apiKey },
		onFinish: (prompt, completion) => {
			setText(completion.trim());
			setDiff(generateDiff(userInput, completion.trim()));
			setWordDiff(generateWordDiff(userInput, completion.trim()));
		},
		onError: (error) => {
			toast.error(`Error: ${error.message}`);
		},
	});

	const placeholders = [
		"Check my grammar...",
		"Improve my writing...",
		"Analyze my text...",
		"Refine my story...",
		"Enhance my essay...",
		"Polish my article...",
		"Proofread my document...",
		"Elevate my content...",
		"Strengthen my message...",
		"Clarify my ideas...",
		"Optimize my copy...",
		"Enrich my narrative...",
		"Bolster my argument...",
		"Refine my prose...",
		"Enhance my style...",
		"Improve my coherence...",
		"Sharpen my focus...",
		"Tighten my structure...",
		"Enhance my vocabulary...",
		"Improve my clarity...",
		"Boost my persuasiveness...",
		"Refine my tone...",
		"Elevate my language...",
		"Polish my punctuation...",
		"Strengthen my voice...",
		"Improve my organization...",
		"Refine my phrasing...",
		"Enhance my impact...",
		"Improve my sentence variety...",
		"Refine my word choice...",
		"Summarize my text...",
	];

	const [placeholderIndex, setPlaceholderIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
		}, 3000);
		return () => {
			clearInterval(interval);
		};
	}, [placeholders.length]);

	const generateDiff = useMemo(() => {
		return (oldText: string, newText: string) => {
			const oldSentences = oldText.split(/(?<=[.!?])\s+/);
			const newSentences = newText.split(/(?<=[.!?])\s+/);
			let diffHtml = "";
			oldSentences.forEach((sentence, index) => {
				const newSentence = newSentences[index];
				if (sentence !== newSentence) {
					diffHtml += `<span class="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200">${sentence}</span>`;
					if (newSentence) {
						diffHtml += `<span class="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">${newSentence}</span>`;
					}
				} else {
					diffHtml += sentence;
				}
				diffHtml += " ";
			});
			if (newSentences.length > oldSentences.length) {
				diffHtml += `<span class="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">${newSentences
					.slice(oldSentences.length)
					.join(" ")}</span>`;
			}
			return diffHtml;
		};
	}, []);

	const generateWordDiff = useMemo(() => {
		return (oldText: string, newText: string) => {
			const diffResult = diffWords(oldText, newText);
			let diffHtml = "";
			diffResult.forEach((part) => {
				const color = part.added ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200" : part.removed ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200" : "";
				diffHtml += `<span class="${color}">${part.value}</span>`;
			});
			return diffHtml;
		};
	}, []);

	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const inputText = e.target.value;
		setUserInput(inputText);
		debouncedWordCountCheck(inputText);
	};

	const debouncedWordCountCheck = useMemo(
		() =>
			debounce((inputText: string) => {
				const wordCount = inputText.trim().split(/\s+/).length;
				setIsInputValid(wordCount <= WORD_COUNT_LIMIT);
				if (wordCount > WORD_COUNT_LIMIT) {
					toast.error(`Input exceeds the limit of ${WORD_COUNT_LIMIT} words.`);
				}
			}, 300),
		[]
	);

	useEffect(() => {
		return () => {
			debouncedWordCountCheck.cancel();
		};
	}, [debouncedWordCountCheck]);

	const handleFormSubmit = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			handleSubmit(e);
			setInput("");
			setText("");
			setDiff("");
			setWordDiff("");
		},
		[handleSubmit, setInput]
	);

	const debouncedHandleFormSubmit = useMemo(
		() => debounce(handleFormSubmit, 500),
		[handleFormSubmit]
	);

	useEffect(() => {
		return () => {
			debouncedHandleFormSubmit.cancel();
		};
	}, [debouncedHandleFormSubmit]);

	const handleCopy = () => {
		navigator.clipboard.writeText(completion || text);
		toast.success("AI response copied to clipboard!");
	};

	const handleErase = () => {
		setUserInput("");
	};

	const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newApiKey = e.target.value;
		setApiKey(newApiKey);
		localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
	};

	return (
		<form
			className="flex flex-col md:flex-row items-start justify-center min-w-full py-10 grow gap-8"
			onSubmit={handleFormSubmit}
		>
			<div className="w-full md:w-1/2">
				<div className="relative">
					<textarea
						value={userInput}
						onChange={handleTextChange}
						className="rounded-lg drop-shadow-sm bg-gray-100 border border-gray-200 px-4 py-2 pr-10 dark:bg-gray-900 dark:border-gray-800 w-full h-[430px] focus:outline-none focus:border-blue-300 dark:focus:border-blue-700 transition-colors resize-none whitespace-pre-wrap overflow-auto text-sm font-mono mb-4"
						placeholder="Paste or type your text here..."
						aria-label="Text"
						required
					/>
					<button
						type="button"
						className="absolute top-2 right-2 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
						onClick={handleErase}
						aria-label="Erase"
					>
						<EraseIcon className="text-gray-600 dark:text-gray-400" />
					</button>
				</div>
				{!isInputValid && (
					<p className="text-red-500 text-sm mb-4">
						Input exceeds the limit of {WORD_COUNT_LIMIT} words.
					</p>
				)}
				<div className="rounded-lg drop-shadow-sm bg-gray-100 border border-gray-200 px-4 py-2 dark:bg-gray-900 dark:border-gray-800 w-full focus:outline-none focus:border-blue-300 dark:focus:border-blue-700 transition-colors text-sm font-mono text-gray-500 dark:text-gray-400 mb-4">
					<h2 className="text-sm font-semibold mb-2 text-gray-500 dark:text-gray-400">Instructions:</h2>
					<ol className="list-decimal list-inside text-gray-500 dark:text-gray-400">
						<li>Enter or paste your text in the input box above (maximum {WORD_COUNT_LIMIT} words).</li>
						<li>Provide a prompt or instruction in the input field below the text box.</li>
						<li>Enter your Groq API key in the input field below the instructions.</li>
						<li>Click the submit button to generate the AI-powered response.</li>
						<li>The AI-generated response will appear in the text box on the right.</li>
						<li>The differences between your original text and the AI response will be highlighted in the boxes below.</li>
					</ol>
				</div>
				<div className="mb-4">
					<input
						type="password"
						value={apiKey}
						onChange={handleApiKeyChange}
						className="rounded-lg drop-shadow-sm bg-gray-100 border border-gray-200 px-4 py-2 dark:bg-gray-900 dark:border-gray-800 w-full focus:outline-none focus:border-blue-300 dark:focus:border-blue-700 transition-colors text-sm font-mono"
						placeholder="Paste your Groq API key"
						aria-label="API Key"
					/>
					<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
						Note: We prioritize your security. Your API key is securely stored in your browser and is not accessible to or saved by our application.
					</p>
				</div>
				<div className="flex items-stretch">
					<input
						className="bg-gray-100 rounded-l-lg py-2 px-4 w-full focus:outline-none dark:bg-gray-900 text-sm font-mono"
						placeholder={placeholders[placeholderIndex]}
						onChange={handleInputChange}
						value={input}
						aria-label="Prompt"
						required
					/>
					<button
						aria-label="Submit"
						type="submit"
						className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-colors text-white rounded-r-lg px-4 text-sm font-mono flex items-center justify-center"
						disabled={!isInputValid}
					>
						{isLoading ? <LoaderIcon /> : <SparklesIcon />}
					</button>
				</div>
			</div>
			<div className="w-full md:w-1/2">
				<div className="relative mb-4">
					<textarea
						value={completion || text}
						readOnly
						className="rounded-lg drop-shadow-sm bg-gray-100 border border-gray-200 px-4 py-2 pr-10 dark:bg-gray-900 dark:border-gray-800 w-full h-[300px] focus:outline-none focus:border-blue-300 dark:focus:border-blue-700 transition-colors resize-none whitespace-pre-wrap overflow-auto text-sm font-mono"
						placeholder="AI-generated response will appear here..."
						aria-label="AI-generated response"
					/>
					{(completion || text) && (
						<button
							type="button"
							className="absolute top-2 right-2 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
							onClick={handleCopy}
							aria-label="Copy"
						>
							<CopyIcon className="text-gray-600 dark:text-gray-400" />
						</button>
					)}
				</div>
				<div className="rounded-lg drop-shadow-sm bg-gray-100 border border-gray-200 px-4 py-2 dark:bg-gray-900 dark:border-gray-800 w-full h-[200px] focus:outline-none focus:border-blue-300 dark:focus:border-blue-700 transition-colors overflow-auto whitespace-pre-wrap text-sm font-mono text-gray-500 dark:text-gray-400 mb-4">
					<TransitionGroup>
						{diff ? (
							<CSSTransition key={diff} classNames="diff" timeout={300}>
								<div dangerouslySetInnerHTML={{ __html: diff }} aria-label="Sentence-level differences"></div>
							</CSSTransition>
						) : (
							<CSSTransition key="sentence-placeholder" classNames="diff" timeout={300}>
								<div>
									The differences between your original text and the AI-generated response will be displayed here. Removed
									sentences will be highlighted in red, while added sentences will be highlighted in green.
								</div>
							</CSSTransition>
						)}
					</TransitionGroup>
				</div>

				<div className="rounded-lg drop-shadow-sm bg-gray-100 border border-gray-200 px-4 py-2 dark:bg-gray-900 dark:border-gray-800 w-full h-[200px] focus:outline-none focus:border-blue-300 dark:focus:border-blue-700 transition-colors overflow-auto whitespace-pre-wrap text-sm font-mono text-gray-500 dark:text-gray-400">
					<TransitionGroup>
						{wordDiff ? (
							<CSSTransition key={wordDiff} classNames="diff" timeout={300}>
								<div dangerouslySetInnerHTML={{ __html: wordDiff }} aria-label="Word-level differences"></div>
							</CSSTransition>
						) : (
							<CSSTransition key="word-placeholder" classNames="diff" timeout={300}>
								<div>
									The word-level differences between your original text and the AI-generated response will be displayed here.
									Added words will be highlighted in green, while removed words will be highlighted in red.
								</div>
							</CSSTransition>
						)}
					</TransitionGroup>
				</div>
			</div>
		</form>
	);
}