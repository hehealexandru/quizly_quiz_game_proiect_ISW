

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => setShowLevelUpModal(false)}
            >
              <Text style={styles.continueBtnText}>{t(language, "continue")}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// Stilurile pentru ecranul de single player.
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerBar: {
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  livesText: {
    fontSize: 22,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    paddingVertical: 24,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  playerName: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    fontFamily: theme.fonts.title,
    textAlign: "center",
    marginBottom: 12,
  },
  scoreTimer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  streakPill: {
    alignSelf: "center",
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  streakText: {
    color: theme.colors.accent,
    fontWeight: "700",
    fontSize: 12,
    fontFamily: theme.fonts.body,
  },
  timerText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  scoreText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontFamily: theme.fonts.mono,
  },
  timeBar: {
    height: 6,
    backgroundColor: theme.colors.bgDeep,
    borderRadius: theme.radius.pill,
    overflow: "hidden",
    marginBottom: 16,
  },
  timeFill: {
    height: "100%",
    borderRadius: theme.radius.pill,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 18,
  },
  powerups: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  powerBtn: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
  },
  powerBtnUsed: {
    backgroundColor: theme.colors.surfaceStrong,
  },
  powerBtnText: {
    color: theme.colors.bgDeep,
    fontWeight: "600",
    textAlign: "center",
  },
  answers: {
    gap: 10,
    marginBottom: 16,
  },
  answerBtn: {
    backgroundColor: theme.colors.surfaceStrong,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
  },
  answerBtnDisabled: {
    opacity: 0.4,
  },
  answerBtnCorrect: {
    backgroundColor: theme.colors.success,
  },
  answerBtnWrong: {
    backgroundColor: theme.colors.danger,
  },
  answerText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  progressText: {
    color: theme.colors.textFaint,
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,11,20,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: theme.radius.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.danger,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalSubText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  reviveBtn: {
    backgroundColor: theme.colors.success,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.radius.md,
    width: "100%",
    marginBottom: 12,
  },
  reviveBtnText: {
    color: theme.colors.bgDeep,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  giveUpBtn: {
    paddingVertical: 12,
  },
  giveUpBtnText: {
    color: theme.colors.textFaint,
    fontSize: 15,
    textDecorationLine: "underline",
  },
  levelUpModal: {
    width: "85%",
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: theme.radius.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  levelUpTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.accent,
    marginBottom: 6,
  },
  levelUpSubtitle: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 10,
  },
  levelUpReward: {
    fontSize: 14,
    color: theme.colors.gold,
    textAlign: "center",
    marginBottom: 16,
  },
  equipBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    width: "100%",
    marginBottom: 8,
  },
  equipBtnText: {
    color: theme.colors.bgDeep,
    fontWeight: "bold",
    textAlign: "center",
  },
  continueBtn: {
    backgroundColor: theme.colors.surfaceStrong,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    width: "100%",
  },
  continueBtnText: {
    color: theme.colors.text,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default QuizScreen;
