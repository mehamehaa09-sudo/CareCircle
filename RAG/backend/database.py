"""SQLite database setup and account models for CareCircle."""

from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship as orm_relationship, sessionmaker


DATABASE_PATH = Path(__file__).with_name("carecircle.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"


class Base(DeclarativeBase):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(160))
    role: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    conditions: Mapped[list["PatientCondition"]] = orm_relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    medications: Mapped[list["Medication"]] = orm_relationship(back_populates="patient", cascade="all, delete-orphan", foreign_keys="Medication.patient_id")
    dose_logs: Mapped[list["DoseLog"]] = orm_relationship(back_populates="patient", cascade="all, delete-orphan", foreign_keys="DoseLog.patient_id")
    checkins: Mapped[list["CheckIn"]] = orm_relationship(back_populates="patient", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = orm_relationship(back_populates="patient", cascade="all, delete-orphan")
    health_questions: Mapped[list["HealthQuestion"]] = orm_relationship(back_populates="patient", cascade="all, delete-orphan")
    prescription_checks: Mapped[list["PrescriptionCheck"]] = orm_relationship(back_populates="patient", cascade="all, delete-orphan")
    patient_relationships: Mapped[list["CaretakerRelationship"]] = orm_relationship(back_populates="patient", foreign_keys="CaretakerRelationship.patient_id", cascade="all, delete-orphan")
    caretaker_relationships: Mapped[list["CaretakerRelationship"]] = orm_relationship(back_populates="caretaker", foreign_keys="CaretakerRelationship.caretaker_id", cascade="all, delete-orphan")


class PatientCondition(Base):
    __tablename__ = "patient_conditions"
    __table_args__ = (UniqueConstraint("patient_id", "condition"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    condition: Mapped[str] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    patient: Mapped[User] = orm_relationship(back_populates="conditions")


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    dosage: Mapped[str] = mapped_column(String(120), default="")
    form: Mapped[str] = mapped_column(String(40), default="tablet")
    instructions: Mapped[str] = mapped_column(String(80), default="anytime")
    duration_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    end_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    patient: Mapped[User] = orm_relationship(back_populates="medications", foreign_keys=[patient_id])
    schedules: Mapped[list["MedicationSchedule"]] = orm_relationship(back_populates="medication", cascade="all, delete-orphan")


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id"), index=True)
    time: Mapped[str] = mapped_column(String(10))
    label: Mapped[str] = mapped_column(String(40))
    medication: Mapped[Medication] = orm_relationship(back_populates="schedules")


class DoseLog(Base):
    __tablename__ = "dose_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id"), index=True)
    date: Mapped[str] = mapped_column(String(20))
    time: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(20))
    taken_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    patient: Mapped[User] = orm_relationship(back_populates="dose_logs", foreign_keys=[patient_id])
    medication: Mapped[Medication] = orm_relationship(foreign_keys=[medication_id])


class CheckIn(Base):
    __tablename__ = "checkins"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    bp_systolic: Mapped[int] = mapped_column(Integer)
    bp_diastolic: Mapped[int] = mapped_column(Integer)
    mood: Mapped[str] = mapped_column(String(80))
    meds_taken: Mapped[bool] = mapped_column(Boolean)
    patient: Mapped[User] = orm_relationship(back_populates="checkins")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    flag_type: Mapped[str] = mapped_column(String(40))
    handoff_report: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    patient: Mapped[User] = orm_relationship(back_populates="alerts")


class HealthQuestion(Base):
    __tablename__ = "health_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    question: Mapped[str] = mapped_column(Text)
    condition_used: Mapped[str] = mapped_column(String(30))
    answer: Mapped[str] = mapped_column(Text)
    citations_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    patient: Mapped[User] = orm_relationship(back_populates="health_questions")


class PrescriptionCheck(Base):
    __tablename__ = "prescription_checks"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    prescription_a: Mapped[str] = mapped_column(Text)
    prescription_b: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    patient: Mapped[User] = orm_relationship(back_populates="prescription_checks")


class CaretakerRelationship(Base):
    __tablename__ = "caretaker_relationships"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    caretaker_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    relationship: Mapped[str] = mapped_column(String(80))
    patient: Mapped[User] = orm_relationship(back_populates="patient_relationships", foreign_keys=[patient_id])
    caretaker: Mapped[User] = orm_relationship(back_populates="caretaker_relationships", foreign_keys=[caretaker_id])


engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def init_db() -> None:
    Base.metadata.create_all(engine)