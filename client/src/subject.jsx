import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // Use useNavigate instead of useHistory
import axios from "axios";
import { API_BASE_URL } from "./auth";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "./dropdown-menu";
import { Button } from "./button";
import { Card } from "./card";

export default function Subject() {
    const [questions, setQuestions] = useState([]);
    const [sortBy, setSortBy] = useState("difficulty");
    const [filterBy, setFilterBy] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // Initialize useNavigate

    const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };

    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/questions?page=${page}`);
                setQuestions(response.data.questions);
                setTotalPages(Math.ceil(response.data.total / 25));
            } catch (error) {
                console.error("Error fetching questions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [page]);

    const filteredQuestions = useMemo(() => {
        let filtered = [...questions];
        if (filterBy !== "all") {
            filtered = filtered.filter((q) => q["Difficulty Level"] === filterBy);
        }
        if (sortBy === "difficulty") {
            filtered.sort(
                (a, b) =>
                    difficultyOrder[a["Difficulty Level"]] - difficultyOrder[b["Difficulty Level"]]
            );
        } else if (sortBy === "title") {
            filtered.sort((a, b) => a["Question Title"].localeCompare(b["Question Title"]));
        }
        return filtered;
    }, [questions, sortBy, filterBy, difficultyOrder]);

    const handleSolve = (id) => {
        console.log(id);
        navigate(`/details/${id}`); // Use navigate to navigate
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div style={{ 
            minHeight: 'calc(100vh - 50px)', 
            backgroundColor: '#2d2d2d', 
            color: '#fff',
            padding: '20px'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Filters Section */}
                <div style={{
                    backgroundColor: '#3d3d3d',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                    <h2 style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        marginBottom: '15px',
                        color: '#fff'
                    }}>
                        Filters
                    </h2>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '15px' 
                    }}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" style={{ width: '100%', backgroundColor: '#4d4d4d', color: '#fff', border: '1px solid #666' }}>
                                    <span style={{ marginRight: '8px' }}>Difficulty: {filterBy === 'all' ? 'All' : filterBy}</span>
                                    <ChevronDownIcon style={{ width: '16px', height: '16px' }} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" style={{ backgroundColor: '#4d4d4d', border: '1px solid #666' }}>
                                <DropdownMenuRadioGroup value={filterBy} onValueChange={setFilterBy}>
                                    <DropdownMenuRadioItem value="all" style={{ color: '#fff' }}>All</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Easy" style={{ color: '#fff' }}>Easy</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Medium" style={{ color: '#fff' }}>Medium</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Hard" style={{ color: '#fff' }}>Hard</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" style={{ width: '100%', backgroundColor: '#4d4d4d', color: '#fff', border: '1px solid #666' }}>
                                    <span style={{ marginRight: '8px' }}>Sort By: {sortBy === 'difficulty' ? 'Difficulty' : 'Title'}</span>
                                    <ChevronDownIcon style={{ width: '16px', height: '16px' }} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" style={{ backgroundColor: '#4d4d4d', border: '1px solid #666' }}>
                                <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                    <DropdownMenuRadioItem value="difficulty" style={{ color: '#fff' }}>Difficulty</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="title" style={{ color: '#fff' }}>Title</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Questions Section */}
                <div style={{
                    backgroundColor: '#3d3d3d',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                    <h2 style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        marginBottom: '20px',
                        color: '#fff'
                    }}>
                        Questions
                    </h2>
                    {loading ? (
                        <p style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>Loading...</p>
                    ) : filteredQuestions.length === 0 ? (
                        <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>No questions found.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {filteredQuestions.map((question) => (
                                <div 
                                    key={question._id} 
                                    style={{
                                        backgroundColor: '#4d4d4d',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        border: '1px solid #666',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#555';
                                        e.currentTarget.style.borderColor = '#9f9ffa';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4d4d4d';
                                        e.currentTarget.style.borderColor = '#666';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                backgroundColor: question["Difficulty Level"] === "Easy"
                                                    ? "#4ade80"
                                                    : question["Difficulty Level"] === "Medium"
                                                        ? "#fbbf24"
                                                        : "#f87171",
                                                color: question["Difficulty Level"] === "Easy"
                                                    ? "#166534"
                                                    : question["Difficulty Level"] === "Medium"
                                                        ? "#78350f"
                                                        : "#7f1d1d"
                                            }}
                                        >
                                            {question["Difficulty Level"]}
                                        </span>
                                    </div>
                                    <h3 style={{ 
                                        fontSize: '18px', 
                                        fontWeight: 'bold', 
                                        marginTop: '10px',
                                        marginBottom: '10px',
                                        color: '#fff'
                                    }}>
                                        {question["Question Title"]}
                                    </h3>
                                    {question["Question Text"] && (
                                        <p style={{ 
                                            color: '#ccc', 
                                            marginBottom: '15px', 
                                            fontSize: '14px',
                                            lineHeight: '1.5'
                                        }}>
                                            {question["Question Text"].length > 150 
                                                ? question["Question Text"].substring(0, 150) + "..." 
                                                : question["Question Text"]}
                                        </p>
                                    )}
                                    <button
                                        onClick={() => handleSolve(question._id)}
                                        style={{
                                            width: '100%',
                                            backgroundColor: '#4ade80',
                                            color: '#000',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#22c55e';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#4ade80';
                                        }}
                                    >
                                        Solve
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Pagination */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginTop: '30px',
                        paddingTop: '20px',
                        borderTop: '1px solid #666'
                    }}>
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            style={{
                                backgroundColor: page === 1 ? '#333' : '#007BFF',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: page === 1 ? 'not-allowed' : 'pointer',
                                opacity: page === 1 ? 0.5 : 1,
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            Previous
                        </button>
                        <span style={{ color: '#fff', fontSize: '14px' }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            style={{
                                backgroundColor: page === totalPages ? '#333' : '#007BFF',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                opacity: page === totalPages ? 0.5 : 1,
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChevronDownIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}
