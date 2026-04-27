import { Types } from "mongoose";
import { StudentStudyModel } from "../student-study.model";

const studentPopulate = {
  path: "student",
  select: "name email role active deletedAt",
};

const teacherPopulate = {
  path: "teacher",
  select: "user specialty avatar degree experience achievement rating",
  populate: {
    path: "user",
    select: "name email",
  },
};

const coursePopulate = {
  path: "course",
  select:
    "title slug shortDescription teacher teacherName image level modes status rating studentCount durationText price originalPrice category",
  populate: {
    path: "category",
    select: "name",
  },
};

const classRoomPopulate = {
  path: "classRoom",
  select:
    "course teacher className mode scheduleText room startedAt endedAt maxStudents isActive isDeleted deletedAt createdAt updatedAt",
};

type FindAllQuery = {
  studentId?: string;
  courseId?: string;
  classRoomId?: string;
  teacherId?: string;
  mode?: string;
  status?: string;
  completionStatus?: string;
  isActive?: string;
};

type CreateStudentStudyRepoPayload = {
  student: Types.ObjectId;
  classRoom: Types.ObjectId;
  course: Types.ObjectId;
  teacher: Types.ObjectId;

  className: string;
  mode: "ONLINE" | "OFFLINE";
  scheduleText: string;
  room: string;

  status: string;
  completionStatus: string;
  completedAt: Date | null;

  score: number;
  progressPercent: number;
  attendancePercent: number;

  test1: number;
  test2: number;
  test3: number;
  finalAverage: number;
  academicLevel: string;

  sessions: Array<{
    sessionNo: number;
    date: Date | null;
    attendanceStatus: "PRESENT" | "LATE" | "ABSENT";
    homeworkStatus: "DONE" | "MISSING";
    teacherNote: string;
    progressScore: number;
  }>;

  rank: number | null;
  performanceStatus: string;
  isHonored: boolean;
  honorTitle: string;
  showHonorOnUserPage: boolean;

  startedAt: Date | null;
  endedAt: Date | null;

  note: string;
  isActive: boolean;
};

type UpdateStudentStudyRepoPayload = Partial<CreateStudentStudyRepoPayload>;

function buildFilter(query: FindAllQuery) {
  const filter: Record<string, unknown> = {};

  if (query.studentId) filter.student = query.studentId;
  if (query.courseId) filter.course = query.courseId;
  if (query.classRoomId) filter.classRoom = query.classRoomId;
  if (query.teacherId) filter.teacher = query.teacherId;

  if (query.mode === "ONLINE" || query.mode === "OFFLINE") {
    filter.mode = query.mode;
  }

  if (
    query.status === "ENROLLED" ||
    query.status === "STUDYING" ||
    query.status === "PAUSED" ||
    query.status === "COMPLETED" ||
    query.status === "DROPPED"
  ) {
    filter.status = query.status;
  }

  if (
    query.completionStatus === "NOT_COMPLETED" ||
    query.completionStatus === "COMPLETED"
  ) {
    filter.completionStatus = query.completionStatus;
  }

  if (query.isActive === "true") filter.isActive = true;
  if (query.isActive === "false") filter.isActive = false;

  return filter;
}

export const studentStudyRepository = {
  findAll(query: FindAllQuery) {
    return StudentStudyModel.find(buildFilter(query))
      .sort({ createdAt: -1 })
      .populate(studentPopulate)
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate);
  },

  findById(id: string) {
    return StudentStudyModel.findById(id)
      .populate(studentPopulate)
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate);
  },

  findDocById(id: string) {
    return StudentStudyModel.findById(id);
  },

  findByStudent(studentId: string) {
    return StudentStudyModel.find({ student: studentId })
      .sort({ createdAt: -1 })
      .populate(studentPopulate)
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate);
  },

  findByClassRoom(classRoomId: string) {
    return StudentStudyModel.find({ classRoom: classRoomId })
      .sort({ createdAt: -1 })
      .populate(studentPopulate)
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate);
  },

  findPublicHonors(limit: number) {
    return StudentStudyModel.find({
      isHonored: true,
      showHonorOnUserPage: true,
      isActive: true,
    })
      .sort({
        score: -1,
        finalAverage: -1,
        attendancePercent: -1,
        updatedAt: -1,
      })
      .limit(limit)
      .populate(studentPopulate)
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate);
  },

  findDuplicateActive(input: { student: string; classRoom: string }) {
    return StudentStudyModel.findOne({
      student: input.student,
      classRoom: input.classRoom,
    });
  },

  findDuplicateActiveExceptId(input: {
    id: string;
    student: string;
    classRoom: string;
  }) {
    return StudentStudyModel.findOne({
      _id: { $ne: input.id },
      student: input.student,
      classRoom: input.classRoom,
    });
  },

  create(payload: CreateStudentStudyRepoPayload) {
    return StudentStudyModel.create(payload);
  },

  updateById(id: string, payload: UpdateStudentStudyRepoPayload) {
    return StudentStudyModel.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true }
    )
      .populate(studentPopulate)
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate);
  },

  deleteById(id: string) {
    return StudentStudyModel.findByIdAndDelete(id);
  },

  findByClassRoomForRanking(classRoomId: string) {
    return StudentStudyModel.find(
      { classRoom: classRoomId, isActive: true },
      { _id: 1, score: 1, updatedAt: 1 }
    );
  },

  updateRankFields(
    id: string,
    payload: {
      rank: number | null;
      performanceStatus: "NORMAL" | "GOOD" | "EXCELLENT";
    }
  ) {
    return StudentStudyModel.findByIdAndUpdate(
      id,
      {
        $set: {
          rank: payload.rank,
          performanceStatus: payload.performanceStatus,
        },
      },
      { new: true }
    );
  },

  syncSnapshotByClassRoom(
    classRoomId: string,
    payload: {
      course: Types.ObjectId;
      teacher: Types.ObjectId;
      className: string;
      mode: "ONLINE" | "OFFLINE";
      scheduleText: string;
      room: string;
      startedAt: Date | null;
      endedAt: Date | null;
    }
  ) {
    return StudentStudyModel.updateMany(
      { classRoom: classRoomId },
      {
        $set: {
          course: payload.course,
          teacher: payload.teacher,
          className: payload.className,
          mode: payload.mode,
          scheduleText: payload.scheduleText,
          room: payload.room,
          startedAt: payload.startedAt,
          endedAt: payload.endedAt,
        },
      }
    );
  },

  deactivateByStudent(studentId: string) {
    return StudentStudyModel.updateMany(
      { student: studentId },
      { $set: { isActive: false } }
    );
  },

  reactivateByStudent(studentId: string) {
    return StudentStudyModel.updateMany(
      { student: studentId, isDeleted: { $ne: true } },
      { $set: { isActive: true } }
    );
  },

  deleteByStudent(studentId: string) {
    return StudentStudyModel.deleteMany({ student: studentId });
  },

  countDocuments(filter: Record<string, unknown>) {
    return StudentStudyModel.countDocuments(filter);
  },
};
