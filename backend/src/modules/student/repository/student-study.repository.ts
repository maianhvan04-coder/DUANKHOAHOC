import { isValidObjectId, Types } from "mongoose";
import { StudentStudyModel } from "../student-study.model";

type CreateStudentStudyRepoPayload = {
  student: Types.ObjectId;
  course: Types.ObjectId;
  classRoom: Types.ObjectId;
  teacher?: Types.ObjectId | null;

  className: string;
  mode: "ONLINE" | "OFFLINE";
  scheduleText: string;
  room: string;

  status?: "ENROLLED" | "STUDYING" | "PAUSED" | "COMPLETED" | "DROPPED";
  completionStatus?: "NOT_COMPLETED" | "COMPLETED";
  completedAt?: Date | null;

  score?: number;
  progressPercent?: number;
  attendancePercent?: number;

  rank?: number | null;
  performanceStatus?: "NORMAL" | "GOOD" | "EXCELLENT";
  isHonored?: boolean;
  honorTitle?: string;
  showHonorOnUserPage?: boolean;

  startedAt?: Date | null;
  endedAt?: Date | null;
  note?: string;
  isActive?: boolean;
};

type UpdateStudentStudyRepoPayload = Partial<CreateStudentStudyRepoPayload>;

const teacherPopulate = {
  path: "teacher",
  select: "specialty avatar degree experience achievement rating user",
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
  populate: [
    {
      path: "course",
      select: "title slug teacher teacherName",
    },
    {
      path: "teacher",
      select: "user specialty avatar degree experience achievement rating",
      populate: {
        path: "user",
        select: "name email",
      },
    },
  ],
};

export const studentStudyRepository = {
  findAll(query: {
    studentId?: string;
    courseId?: string;
    classRoomId?: string;
    teacherId?: string;
    mode?: string;
    status?: string;
    completionStatus?: string;
    isActive?: string;
  }) {
    const filter: Record<string, unknown> = {};

    if (query.studentId && isValidObjectId(query.studentId)) {
      filter.student = new Types.ObjectId(query.studentId);
    }

    if (query.courseId && isValidObjectId(query.courseId)) {
      filter.course = new Types.ObjectId(query.courseId);
    }

    if (query.classRoomId && isValidObjectId(query.classRoomId)) {
      filter.classRoom = new Types.ObjectId(query.classRoomId);
    }

    if (query.teacherId && isValidObjectId(query.teacherId)) {
      filter.teacher = new Types.ObjectId(query.teacherId);
    }

    if (query.mode) filter.mode = query.mode;
    if (query.status) filter.status = query.status;
    if (query.completionStatus) filter.completionStatus = query.completionStatus;
    if (query.isActive === "true") filter.isActive = true;
    if (query.isActive === "false") filter.isActive = false;

    return StudentStudyModel.find(filter)
      .populate({
        path: "student",
        select: "name email role active deletedAt",
      })
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate)
      .sort({ createdAt: -1 });
  },

  findById(id: string) {
    return StudentStudyModel.findById(id)
      .populate({
        path: "student",
        select: "name email role active deletedAt",
      })
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate);
  },

  findByStudent(studentId: string) {
    return StudentStudyModel.find({
      student: studentId,
    })
      .populate({
        path: "student",
        select: "name email role active deletedAt",
      })
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate)
      .sort({ createdAt: -1 });
  },

  findByClassRoom(classRoomId: string) {
    return StudentStudyModel.find({
      classRoom: classRoomId,
    })
      .populate({
        path: "student",
        select: "name email role active deletedAt",
      })
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate)
      .sort({ createdAt: -1 });
  },

  findDuplicateActive(payload: {
    student: string;
    classRoom: string;
  }) {
    return StudentStudyModel.findOne({
      student: payload.student,
      classRoom: payload.classRoom,
      isActive: true,
    });
  },

  findDuplicateActiveExceptId(payload: {
    id: string;
    student: string;
    classRoom: string;
  }) {
    return StudentStudyModel.findOne({
      _id: { $ne: payload.id },
      student: payload.student,
      classRoom: payload.classRoom,
      isActive: true,
    });
  },

  findByClassRoomForRanking(classRoomId: string) {
    return StudentStudyModel.find({
      classRoom: classRoomId,
      isActive: true,
    }).sort({ score: -1, updatedAt: 1 });
  },

  syncSnapshotByClassRoom(
    classRoomId: string,
    payload: {
      course: Types.ObjectId;
      teacher: Types.ObjectId | null;
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
        $set: payload,
      }
    );
  },

  updateHonorFields(
    id: string,
    payload: {
      rank?: number | null;
      performanceStatus?: "NORMAL" | "GOOD" | "EXCELLENT";
      isHonored?: boolean;
      honorTitle?: string;
      showHonorOnUserPage?: boolean;
    }
  ) {
    return StudentStudyModel.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true }
    );
  },

  findPublicHonors(limit = 10) {
    return StudentStudyModel.find({
      isActive: true,
      showHonorOnUserPage: true,
      isHonored: true,
    })
      .populate({
        path: "student",
        select: "name",
      })
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate)
      .sort({ score: -1, updatedAt: -1 })
      .limit(limit);
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
      .populate({
        path: "student",
        select: "name email role active deletedAt",
      })
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate);
  },

  deleteById(id: string) {
    return StudentStudyModel.findByIdAndDelete(id);
  },
};