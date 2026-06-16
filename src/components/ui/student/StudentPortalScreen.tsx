import { useCallback, useEffect, useMemo, useState } from "react";
import StudentPortalLayout, {
  type StudentPortalTabKey,
} from "../../layout/StudentPortalLayout";
import { blogService } from "../../../services/blog.service";
import { notificationService } from "../../../services/notification.service";
import { studentStudyService } from "../../../services/studentStudy.service";
import type { User, UserAccess } from "../../../types/auth.type";
import type { BlogItem } from "../../../types/blog.type";
import type { NotificationItem } from "../../../types/notification.type";
import type { StudentStudyItem } from "../../../types/student-study.type";
import {
  getActiveStudies,
  getErrorMessage,
} from "../../../utils/studentPortal.util";
import StudentFeedTab from "./StudentFeedTab";
import StudentGradesTab from "./StudentGradesTab";
import StudentScheduleTab from "./StudentScheduleTab";
import StudentSettingsTab from "./StudentSettingsTab";

type StudentPortalScreenProps = {
  user: User;
  access: UserAccess | null;
  onLogout: () => Promise<void>;
};

export default function StudentPortalScreen({
  user,
  access,
  onLogout,
}: StudentPortalScreenProps) {
  const [activeTab, setActiveTab] = useState<StudentPortalTabKey>("feed");
  const [studies, setStudies] = useState<StudentStudyItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [blogErrorText, setBlogErrorText] = useState("");

  const loadData = useCallback(
    async (silent = false) => {
      try {
        if (silent) setRefreshing(true);
        else setLoading(true);

        setErrorText("");

        const notificationFallback = {
          items: [] as NotificationItem[],
          unreadCount: 0,
          pagination: {
            page: 1,
            limit: 5,
            total: 0,
            totalPages: 0,
          },
        };

        const blogFallback = {
          items: [] as BlogItem[],
          pagination: {
            page: 1,
            limit: 6,
            total: 0,
            totalPages: 0,
          },
        };

        const [studyData, notificationData, blogData] = await Promise.all([
          studentStudyService.listByStudent(user.id),
          notificationService
            .getMine({ page: 1, limit: 5 })
            .catch(() => notificationFallback),
          blogService
            .getAll({
              page: 1,
              limit: 6,
              sortBy: "publishedAt",
              sortOrder: "desc",
            })
            .then((data) => ({ data, errorText: "" }))
            .catch((error) => ({
              data: blogFallback,
              errorText: getErrorMessage(error, "Không tải được bài viết"),
            })),
        ]);

        setStudies(studyData);
        setNotifications(notificationData.items);
        setUnreadCount(notificationData.unreadCount);
        setBlogs(blogData.data.items);
        setBlogErrorText(blogData.errorText);
      } catch (error) {
        setStudies([]);
        setNotifications([]);
        setBlogs([]);
        setUnreadCount(0);
        setBlogErrorText("");
        setErrorText(getErrorMessage(error, "Không tải được dữ liệu học viên"));
      } finally {
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    },
    [user.id]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeStudies = useMemo(() => getActiveStudies(studies), [studies]);

  const content = useMemo(() => {
    if (activeTab === "feed") {
      return (
        <StudentFeedTab
          user={user}
          studies={activeStudies}
          unreadCount={unreadCount}
          blogs={blogs}
          blogErrorText={blogErrorText}
        />
      );
    }

    if (activeTab === "schedule") {
      return <StudentScheduleTab studies={activeStudies} />;
    }

    if (activeTab === "grades") {
      return <StudentGradesTab studies={activeStudies} />;
    }

    return (
      <StudentSettingsTab user={user} access={access} onLogout={onLogout} />
    );
  }, [
    access,
    activeStudies,
    activeTab,
    blogErrorText,
    blogs,
    onLogout,
    unreadCount,
    user,
  ]);

  return (
    <StudentPortalLayout
      activeTab={activeTab}
      email={user.email}
      role={access?.primaryRole || "STUDENT"}
      loading={loading}
      refreshing={refreshing}
      errorText={errorText}
      notifications={notifications}
      unreadCount={unreadCount}
      onChangeTab={setActiveTab}
      onRefresh={() => void loadData(true)}
    >
      {content}
    </StudentPortalLayout>
  );
}
