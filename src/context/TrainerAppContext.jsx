import { createContext, useCallback, useContext, useEffect, useLayoutEffect } from "react"
import { Provider, useDispatch, useSelector } from "react-redux"
import { receiveTrainerUiAction, trainerStore } from "js/trainer-ui-state.js"
import { applyTheme } from "js/theme.js"

const TrainerAppContext = createContext(null)

/** @returns {[import("js/trainer-ui-state.js").TrainerUiState, import("react").Dispatch<any>]} */
export function useTrainerApp() {
    const v = useContext(TrainerAppContext)
    if (!v) throw new Error("useTrainerApp вне TrainerAppProvider")
    return v
}

function TrainerAppBridge({ children }) {
    const state = useSelector((s) => s.trainer)
    const dispatchRedux = useDispatch()
    const dispatch = useCallback(
        (/** @type {import("js/trainer-ui-state.js").TrainerUiAction} */ action) => {
            dispatchRedux(receiveTrainerUiAction(action))
        },
        [dispatchRedux]
    )

    useLayoutEffect(() => {
        applyTheme(state.persisted.themeId)
    }, [state.persisted.themeId])

    useEffect(() => {
        document.body.classList.toggle(
            "help-reference-open",
            !!(state.overlay.casesHelp || state.overlay.verbsHelp)
        )
    }, [state.overlay.casesHelp, state.overlay.verbsHelp])

    useEffect(() => {
        const o = state.overlay
        document.body.classList.toggle("pack-prompt-modal-open", o.packPrompt)
        document.body.classList.toggle("vocab-round-summary-modal-open", o.vocabRound)
    }, [state.overlay.packPrompt, state.overlay.vocabRound])

    return (
        <TrainerAppContext.Provider value={[state, dispatch]}>
            {children}
        </TrainerAppContext.Provider>
    )
}

export function TrainerAppProvider({ children }) {
    return (
        <Provider store={trainerStore}>
            <TrainerAppBridge>{children}</TrainerAppBridge>
        </Provider>
    )
}

/**
 * Dispatch domain UI actions into Redux without subscribing to full trainer state.
 * @returns {import("react").Dispatch<import("js/trainer-ui-state.js").TrainerUiAction>}
 */
export function useTrainerDispatch() {
    const dispatchRedux = useDispatch()
    return useCallback(
        (/** @type {import("js/trainer-ui-state.js").TrainerUiAction} */ action) => {
            dispatchRedux(receiveTrainerUiAction(action))
        },
        [dispatchRedux]
    )
}
