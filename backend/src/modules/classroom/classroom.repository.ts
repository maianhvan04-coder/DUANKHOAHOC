import { isValidObjectId, Types } from "mongoose";
import { ClassRoomModel } from "./classroom.model";

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

type CreateClassRoomRepoPayload = {
  course: Types.ObjectId;
  teacher: Types.ObjectId;
  className: string;
  mode: "ONLINE" | "OFFLINE";
  scheduleText: string;
  room: string;
  startedAt?: Date | null;
  endedAt?: Date | null;
  maxStudents?: number;
  isActive?: boolean;
};

type UpdateClassRoomRepoPayload = Partial<CreateClassRoomRepoPayload>;

export const classRoomRepository = {
  findAll(query: {
    courseId?: string;
    teacherId?: string;
    isActive?: string;
  }) {
    const filter: Record<string, unknown> = {
      isDeleted: false,
    };

    if (query.courseId && isValidObjectId(query.courseId)) {
      filter.course = new Types.ObjectId(query.courseId);
    }

    if (query.teacherId && isValidObjectId(query.teacherId)) {
      filter.teacher = new Types.ObjectId(query.teacherId);
    }

    if (query.isActive === "true") filter.isActive = true;
    if (query.isActive === "false") filter.isActive = false;

    return ClassRoomModel.find(filter)
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .sort({ createdAt: -1 });
  },

  findDeleted() {
    return ClassRoomModel.find({
      isDeleted: true,
    })
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .sort({ deletedAt: -1 });
  },

  findById(id: string) {
    return ClassRoomModel.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate(coursePopulate)
      .populate(teacherPopulate);
  },

  findDeletedById(id: string) {
    return ClassRoomModel.findOne({
      _id: id,
      isDeleted: true,
    })
      .populate(coursePopulate)
      .populate(teacherPopulate);
  },

  findAnyById(id: string) {
    return ClassRoomModel.findById(id)
      .populate(coursePopulate)
      .populate(teacherPopulate);
  },

  findDuplicate(courseId: string, className: string) {
    return ClassRoomModel.findOne({
      course: courseId,
      className,
      isDeleted: false,
    });
  },

  findDuplicateExcludeId(courseId: string, className: string, id: string) {
    return ClassRoomModel.findOne({
      _id: { $ne: id },
      course: courseId,
      className,
      isDeleted: false,
    });
  },

  create(payload: CreateClassRoomRepoPayload) {
    return ClassRoomModel.create(payload);
  },

  updateById(id: string, payload: UpdateClassRoomRepoPayload) {
    return ClassRoomModel.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        $set: payload,
      },
      {
        new: true,
      }
    )
      .populate(coursePopulate)
      .populate(teacherPopulate);
  },

  softDeleteById(id: string) {
    return ClassRoomModel.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      {
        new: true,
      }
    )
      .populate(coursePopulate)
      .populate(teacherPopulate);
  },

  restoreById(id: string) {
    return ClassRoomModel.findOneAndUpdate(
      {
        _id: id,
        isDeleted: true,
      },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
        },
      },
      {
        new: true,
      }
    )
      .populate(coursePopulate)
      .populate(teacherPopulate);
  },

  forceDeleteById(id: string) {
    return ClassRoomModel.findByIdAndDelete(id)
      .populate(coursePopulate)
      .populate(teacherPopulate);
  },
};