import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { courseService } from "../services/course.service";
import { Course, CourseFormData } from "../types/course.type";
import { emptyCourseForm } from "../utils/course.util";

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CourseFormData>(emptyCourseForm);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredCourses = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return courses;

    return courses.filter((course) => {
      return (
        course.title.toLowerCase().includes(keyword) ||
        course.teacher.toLowerCase().includes(keyword) ||
        course.category.toLowerCase().includes(keyword)
      );
    });
  }, [courses, search]);

  const totalStudents = courses.reduce(
    (total, course) => total + course.studentCount,
    0
  );

  const totalOpenCourses = courses.filter(
    (course) => course.status === "OPEN"
  ).length;

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourses();
      setCourses(data);
    } catch {
      Alert.alert("Lỗi", "Không thể tải danh sách khóa học");
    } finally {
      setLoading(false);
    }
  };

  const refreshCourses = async () => {
    try {
      setRefreshing(true);
      const data = await courseService.getCourses();
      setCourses(data);
    } catch {
      Alert.alert("Lỗi", "Không thể làm mới dữ liệu");
    } finally {
      setRefreshing(false);
    }
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setForm(emptyCourseForm);
    setModalVisible(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      teacher: course.teacher,
      category: course.category,
      level: course.level,
      mode: course.mode,
      price: String(course.price),
      studentCount: String(course.studentCount),
      status: course.status,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setEditingCourse(null);
    setForm(emptyCourseForm);
    setModalVisible(false);
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên khóa học");
      return false;
    }

    if (!form.teacher.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập giáo viên");
      return false;
    }

    if (!form.category.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập danh mục");
      return false;
    }

    if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      Alert.alert("Sai dữ liệu", "Học phí không hợp lệ");
      return false;
    }

    if (
      Number.isNaN(Number(form.studentCount)) ||
      Number(form.studentCount) < 0
    ) {
      Alert.alert("Sai dữ liệu", "Số học viên không hợp lệ");
      return false;
    }

    return true;
  };

  const saveCourse = async () => {
    try {
      if (!validateForm()) return;

      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, form);
      } else {
        await courseService.createCourse(form);
      }

      await loadCourses();
      closeModal();
    } catch {
      Alert.alert("Lỗi", "Không thể lưu khóa học");
    }
  };

  const deleteCourse = (courseId: string) => {
    Alert.alert("Xóa khóa học", "Bạn có chắc chắn muốn xóa khóa học này?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await courseService.deleteCourse(courseId);
            await loadCourses();
          } catch {
            Alert.alert("Lỗi", "Không thể xóa khóa học");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return {
    courses,
    filteredCourses,
    search,
    setSearch,

    form,
    setForm,

    editingCourse,
    modalVisible,

    loading,
    refreshing,

    totalStudents,
    totalOpenCourses,

    loadCourses,
    refreshCourses,
    openCreateModal,
    openEditModal,
    closeModal,
    saveCourse,
    deleteCourse,
  };
};