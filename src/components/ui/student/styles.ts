import { StyleSheet } from "react-native";

export const studentScheduleStyles = StyleSheet.create({
    root: {
        paddingBottom: 16,
    },

    weekBox: {
        marginBottom: 14,
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
    },

    prevBtn: {
        borderRadius: 14,
        backgroundColor: "#EFF6FF",
        paddingHorizontal: 16,
        paddingVertical: 10,
    },

    prevText: {
        color: "#2563EB",
        fontWeight: "800",
    },

    weekCenter: {
        flex: 1,
        alignItems: "center",
    },

    weekLabel: {
        fontSize: 11,
        color: "#64748B",
    },

    weekText: {
        marginTop: 2,
        fontSize: 14,
        color: "#0F172A",
        fontWeight: "900",
    },

    nextBtn: {
        borderRadius: 14,
        backgroundColor: "#2563EB",
        paddingHorizontal: 18,
        paddingVertical: 10,
    },

    nextText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },

    timelineWrap: {
        paddingTop: 4,
    },

    timelineRow: {
        flexDirection: "row",
        minHeight: 78,
        marginBottom: 8,
    },

    dayCol: {
        width: 58,
        paddingTop: 10,
        alignItems: "flex-start",
    },

    dayText: {
        fontSize: 12,
        color: "#334155",
        fontWeight: "900",
    },

    todayDayText: {
        color: "#2563EB",
    },

    dateText: {
        marginTop: 2,
        fontSize: 12,
        color: "#64748B",
    },

    todayDateText: {
        color: "#2563EB",
        fontWeight: "700",
    },

    lineCol: {
        width: 26,
        alignItems: "center",
        position: "relative",
    },

    verticalLine: {
        position: "absolute",
        top: 0,
        bottom: -8,
        width: 2,
        backgroundColor: "#DDE7F3",
    },

    iconOuter: {
        marginTop: 13,
        width: 18,
        height: 18,
        borderRadius: 5,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#BAE6FD",
        alignItems: "center",
        justifyContent: "center",
    },

    todayIconOuter: {
        backgroundColor: "#2563EB",
        borderColor: "#2563EB",
    },

    iconText: {
        fontSize: 10,
        lineHeight: 12,
        color: "#0EA5E9",
        fontWeight: "900",
    },

    todayIconText: {
        color: "#FFFFFF",
    },

    cardCol: {
        flex: 1,
    },

    lessonCard: {
        minHeight: 66,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        justifyContent: "center",
    },

    lessonCardSpacing: {
        marginTop: 8,
    },

    normalCard: {
        backgroundColor: "#FFFFFF",
    },

    todayCard: {
        backgroundColor: "#2F95EA",
    },

    emptyLessonCard: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderStyle: "dashed",
    },

    lessonTitle: {
        fontSize: 14,
        fontWeight: "900",
    },

    normalTitle: {
        color: "#0F172A",
    },

    todayTitle: {
        color: "#FFFFFF",
    },

    lessonMeta: {
        marginTop: 6,
        fontSize: 11,
        fontWeight: "500",
    },

    normalMeta: {
        color: "#64748B",
    },

    todayMeta: {
        color: "#E0F2FE",
    },

    emptyLessonText: {
        fontSize: 13,
        color: "#94A3B8",
        fontWeight: "700",
    },

    todayEmptyLessonText: {
        color: "#FFFFFF",
    },
});

export const studentSettingsStyles = StyleSheet.create({
    root: {
        paddingBottom: 24,
    },

    loadingBox: {
        minHeight: 320,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        padding: 16,
    },

    header: {
        backgroundColor: "#DDFBF3",

        marginHorizontal: -16,
        marginTop: -16,
        marginBottom: 16,

        paddingHorizontal: 0,
        paddingTop: 38,
        paddingBottom: 28,

        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },

    profileRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 0,

        paddingLeft: 8,
        paddingRight: 16,

        transform: [{ translateY: 18 }],
    },

    avatar: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: "#0F9F8F",
        borderWidth: 3,
        borderColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },

    avatarText: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "900",
    },

    profileInfo: {
        flex: 1,
        marginLeft: 12,
    },

    name: {
        fontSize: 17,
        fontWeight: "900",
        color: "#0F172A",
    },

    phone: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: "600",
        color: "#334155",
    },

    banner: {
        height: 74,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
        justifyContent: "flex-end",
    },

    bannerCircleLeft: {
        position: "absolute",
        left: -28,
        bottom: -30,
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#14B8A6",
    },

    bannerCircleRight: {
        position: "absolute",
        right: -18,
        top: -28,
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: "#F59E0B",
    },

    bannerContent: {
        height: 38,
        backgroundColor: "#047857",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
    },

    bannerIcon: {
        fontSize: 17,
        marginRight: 8,
    },

    bannerText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

    errorBox: {
        marginBottom: 12,
        borderRadius: 14,
        backgroundColor: "#FEF2F2",
        paddingHorizontal: 14,
        paddingVertical: 10,
    },

    errorText: {
        color: "#DC2626",
        fontSize: 13,
        fontWeight: "700",
    },

    successBox: {
        marginBottom: 12,
        borderRadius: 14,
        backgroundColor: "#ECFDF5",
        paddingHorizontal: 14,
        paddingVertical: 10,
    },

    successText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "700",
    },

    menuBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        overflow: "hidden",
        paddingVertical: 0,
        marginBottom: 16,

        // cho sát 2 bên rìa hơn
        marginHorizontal: -10,
    },

    menuItem: {
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#EEF2F7",
    },

    menuItemLast: {
        borderBottomWidth: 0,
    },

    menuIconBox: {
        width: 26,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },

    menuIcon: {
        fontSize: 15,
    },

    menuTitle: {
        flex: 1,
        fontSize: 13,
        color: "#111827",
        fontWeight: "600",
    },

    menuArrow: {
        fontSize: 22,
        color: "#CBD5E1",
        fontWeight: "700",
    },

    infoBox: {
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#EEF2F7",
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },

    infoLabel: {
        width: 110,
        fontSize: 12,
        color: "#64748B",
        fontWeight: "600",
    },

    infoValue: {
        flex: 1,
        textAlign: "right",
        fontSize: 12,
        color: "#0F172A",
        fontWeight: "800",
    },

    passwordBox: {
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#EEF2F7",
    },

    logoutBtn: {
        height: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#EF4444",
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,

        // cho nút đăng xuất sát theo menu
        marginHorizontal: -10,
    },

    logoutIcon: {
        color: "#EF4444",
        fontSize: 15,
        marginRight: 8,
        fontWeight: "900",
    },

    logoutText: {
        color: "#EF4444",
        fontSize: 13,
        fontWeight: "800",
    },
});