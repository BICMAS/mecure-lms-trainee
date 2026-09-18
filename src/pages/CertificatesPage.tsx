import { useEffect, useMemo, useState } from "react";
import { Award, Download } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { CertificateModal } from "@/components/CertificateModal";
import { useAuth } from "@/context/AuthContext";
import {
  claimMyTopicCertificate,
  listMyTopicCertificates,
  type TopicCertificateRow,
} from "@/api/certificates";

export default function CertificatesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [topics, setTopics] = useState<TopicCertificateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicCertificateRow | null>(
    null,
  );
  const [isPreparingCertificate, setIsPreparingCertificate] = useState<string | null>(
    null,
  );
  const [pageMessage, setPageMessage] = useState("");
  const [certificateIssuedState, setCertificateIssuedState] = useState<
    Record<string, "issued_now" | "already_issued" | "reissued">
  >({});

  const requestedCategoryId = searchParams.get("category");

  const loadTopics = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const rows = await listMyTopicCertificates();
      setTopics(rows);
    } catch {
      setIsError(true);
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTopics();
  }, []);

  const eligibleTopics = useMemo(
    () => topics.filter((topic) => topic.eligible || topic.hasCertificate),
    [topics],
  );

  const openCertificate = async (topic: TopicCertificateRow) => {
    setPageMessage("");
    if (!topic.eligible && !topic.hasCertificate) {
      setPageMessage(
        `Finish all courses in ${topic.categoryName} first (${topic.completedCount}/${topic.assignedCount} complete).`,
      );
      return;
    }

    setIsPreparingCertificate(topic.categoryId);

    try {
      const claimed = await claimMyTopicCertificate(topic.categoryId);
      const certificateUrl =
        claimed?.certificate?.certificateUrl ?? claimed?.certificate?.pdfPath;
      setCertificateIssuedState((prev) => ({
        ...prev,
        [topic.categoryId]: claimed?.reissued
          ? "reissued"
          : claimed?.issued
            ? "issued_now"
            : "already_issued",
      }));

      setSelectedTopic({
        ...topic,
        hasCertificate: true,
        eligible: true,
        certificateUrl,
        certificate: claimed.certificate,
      });
      await loadTopics();
    } catch (error: unknown) {
      setPageMessage(
        error instanceof Error ? error.message : "Certificate is not ready yet.",
      );
      setSelectedTopic(null);
    } finally {
      setIsPreparingCertificate(null);
    }
  };

  useEffect(() => {
    if (!topics.length || selectedTopic) return;

    if (requestedCategoryId) {
      const topic = topics.find((row) => row.categoryId === requestedCategoryId);
      if (!topic) return;
      if (topic.eligible || topic.hasCertificate) {
        void openCertificate(topic);
      } else {
        setPageMessage(
          `Finish all courses in ${topic.categoryName} first (${topic.completedCount}/${topic.assignedCount} complete).`,
        );
      }
    }
  }, [topics, requestedCategoryId, selectedTopic]);

  const handleCloseModal = () => {
    setSelectedTopic(null);
    if (requestedCategoryId || searchParams.get("course")) {
      setSearchParams({});
    }
  };

  if (!user) return null;

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Loading certificates...</div>;
  }

  if (isError) {
    return (
      <div className="p-10 text-center text-slate-500">
        We could not load your certificates right now.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Your Certificates</h2>
          <p className="mt-2 text-slate-500">
            Certificates are awarded when you finish every assigned course in a
            topic.
          </p>
          {pageMessage && (
            <p className="mt-2 text-sm text-amber-700">{pageMessage}</p>
          )}
        </div>

        {!topics.length ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
            Complete all courses in a topic to unlock your first certificate.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topics.map((topic) => {
              const ready = topic.eligible || topic.hasCertificate;
              return (
                <div
                  key={topic.categoryId}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          ready
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Award size={14} />
                        {ready ? "Topic complete" : "In progress"}
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-slate-900">
                        {topic.categoryName}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {topic.completedCount}/{topic.assignedCount} assigned
                        courses complete
                      </p>
                      {!ready && (
                        <p className="mt-2 text-sm text-amber-700">
                          Finish all courses in this topic to unlock the
                          certificate.
                        </p>
                      )}
                      {certificateIssuedState[topic.categoryId] === "reissued" && (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          Updated with the latest certificate template
                        </p>
                      )}
                      {certificateIssuedState[topic.categoryId] === "issued_now" && (
                        <p className="mt-2 text-xs font-medium text-emerald-700">
                          Issued now
                        </p>
                      )}
                      {certificateIssuedState[topic.categoryId] ===
                        "already_issued" && (
                        <p className="mt-2 text-xs font-medium text-brand-primary">
                          Already issued
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCertificate(topic)}
                    disabled={
                      !ready || isPreparingCertificate === topic.categoryId
                    }
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:bg-brand-primary/60"
                  >
                    <Download size={16} />
                    {isPreparingCertificate === topic.categoryId
                      ? "Preparing certificate..."
                      : ready
                        ? "Download Certificate"
                        : "Not ready yet"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!eligibleTopics.length && topics.length > 0 && (
          <p className="text-center text-sm text-slate-500">
            Keep learning — certificates unlock when each topic is fully
            complete.
          </p>
        )}
      </div>

      <CertificateModal
        isOpen={!!selectedTopic}
        onClose={handleCloseModal}
        onConfirm={handleCloseModal}
        categoryId={selectedTopic?.categoryId}
        courseTitle={selectedTopic?.categoryName ?? ""}
        recipientName={user.name}
        certificateUrl={
          selectedTopic?.certificateUrl
          ?? selectedTopic?.certificate?.certificateUrl
          ?? selectedTopic?.certificate?.pdfPath
        }
      />
    </>
  );
}
