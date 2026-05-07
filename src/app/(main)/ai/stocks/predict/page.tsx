import PredictionForm from './components/predict-form';
import PredictionResult from './components/predict-result';

export default function Page() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-4 flex-1 h-full min-h-0">
      <PredictionForm />
      <PredictionResult />
    </div>
  );
}
